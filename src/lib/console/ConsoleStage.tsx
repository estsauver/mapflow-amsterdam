import React, { useEffect, useRef, useState } from 'react';
import { FIDELITY_DURATION, FidelityEra, FidelityLimitKey, applyLimits, fidelityAt, fidelityFinal } from '@/lib/fidelity';
import { CanvasPainter } from './CanvasPainter';
import { Frame, computeFrame } from './layout';
import { RetroPostProcessor } from './post/RetroPostProcessor';
import { TiltConfig, planeFromScreen } from './tilt';
import type { GameFactory, Input, PointerState } from './types';

interface ConsoleStageProps {
  program: GameFactory;
  /** Begin this many seconds into the fidelity ramp (previews and QA). */
  startAt?: number;
  duration?: number;
  limits?: Partial<Record<FidelityLimitKey, number>>;
  showEraTag?: boolean;
}

const ERA_LABEL: Record<FidelityEra, string> = {
  'eight-bit': '8-BIT ERA',
  'sixteen-bit': '16-BIT ERA',
  'early-3d': 'EARLY 3D ERA',
  modern: 'MODERN ERA',
};

const PERSPECTIVE_DIST = 3.2; // in half-heights of the plane

/**
 * Runs a console GameProgram: draws it with CanvasPainter at the fidelity
 * ramp's virtual resolution and renders the result through the GPU post
 * pipeline. Pointer input is mapped back through the perspective tilt.
 *
 * Without WebGL2 the games cannot be rendered at all, so a short notice is
 * shown instead (the same disclosed behaviour as the black hole scene).
 */
const ConsoleStage = ({ program, startAt = 0, duration = FIDELITY_DURATION, limits, showEraTag = true }: ConsoleStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [era, setEra] = useState<{ era: FidelityEra; n: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let post: RetroPostProcessor;
    try {
      post = new RetroPostProcessor(canvas);
    } catch (err) {
      console.error('ConsoleStage: WebGL2 pipeline failed to start', err);
      setSupported(false);
      return;
    }
    setSupported(true);

    const layers = [0, 1, 2].map(() => document.createElement('canvas'));
    const painter = new CanvasPainter(layers);
    const game = program({ openUrl: url => window.open(url, '_blank', 'noopener,noreferrer') });

    // ---- input ----
    const pointer: PointerState = { x: -1, y: -1, down: false, justPressed: false, justReleased: false, inside: false };
    const pointerNorm = { x: 0, y: 0 }; // -1..1, y down
    const pointerSmooth = { x: 0, y: 0 };
    const keysDown = new Set<string>();
    let keysJustPressed = new Set<string>();
    let tilt: TiltConfig = { rx: 0, ry: 0, aspect: 16 / 9, dist: PERSPECTIVE_DIST, shrink: 1 };
    let frame: Frame | null = null;

    const updatePointer = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) return;
      const sx = ((e.clientX - b.left) / b.width) * 2 - 1;
      const syUp = 1 - ((e.clientY - b.top) / b.height) * 2;
      pointerNorm.x = Math.max(-1, Math.min(1, sx));
      pointerNorm.y = Math.max(-1, Math.min(1, -syUp));
      const p = planeFromScreen(sx, syUp, tilt);
      if (!p || !frame) {
        pointer.inside = false;
        return;
      }
      pointer.x = p.u * frame.logicalWidth;
      pointer.y = (1 - p.v) * frame.logicalHeight;
      pointer.inside = p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1;
    };
    // Only the primary button of one pointer at a time counts as a game click.
    let activePointer: number | null = null;
    const onMove = (e: PointerEvent) => updatePointer(e);
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || activePointer !== null) return;
      activePointer = e.pointerId;
      updatePointer(e);
      pointer.down = true;
      pointer.justPressed = true;
      canvas.setPointerCapture?.(e.pointerId);
    };
    const release = (e: PointerEvent) => {
      if (e.pointerId !== activePointer) return;
      activePointer = null;
      pointer.down = false;
      pointer.justReleased = true;
    };
    const onUp = (e: PointerEvent) => {
      updatePointer(e);
      release(e);
    };
    const onCancel = (e: PointerEvent) => release(e);
    const onLeave = () => {
      pointer.inside = false;
      pointerNorm.x = 0;
      pointerNorm.y = 0;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keysDown.add(e.key);
      keysJustPressed.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => keysDown.delete(e.key);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('lostpointercapture', onCancel);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // ---- frame loop ----
    let elapsed = Math.max(0, startAt);
    let time = 0;
    let last = 0;
    let raf = 0;
    let running = true;
    let currentEra: FidelityEra | null = null;
    let eraCount = 0;
    let fps = 0, fpsFrames = 0, fpsStart = 0;

    // Live window resizes change the container size every frame; keep rendering at the
    // last adopted size and only reallocate once the new size has held for a moment.
    const SIZE_SETTLE_MS = 120;
    let adopted = { w: 0, h: 0, dpr: 0 };
    let candidate = { w: 0, h: 0, dpr: 0, since: 0 };
    const adoptSize = (now: number) => {
      const w = container.clientWidth, h = container.clientHeight, dpr = window.devicePixelRatio;
      if (w === adopted.w && h === adopted.h && dpr === adopted.dpr) return;
      if (w !== candidate.w || h !== candidate.h || dpr !== candidate.dpr) candidate = { w, h, dpr, since: now };
      if (adopted.w === 0 || now - candidate.since >= SIZE_SETTLE_MS) adopted = { w, h, dpr };
    };

    /** Advances the game by dt seconds and renders one frame. Returns false once the stage has stopped. */
    const renderFrame = (dt: number): boolean => {
      if (post.lost) return true;
      elapsed += dt;
      time += dt;
      try {
        const fid = applyLimits(reducedMotion ? fidelityFinal() : fidelityAt(elapsed, duration), limits);
        if (fid.era !== currentEra) {
          currentEra = fid.era;
          eraCount++;
          if (showEraTag && !reducedMotion) setEra({ era: fid.era, n: eraCount });
        }

        adoptSize(performance.now());
        if (adopted.w < 2 || adopted.h < 2) return true;
        frame = computeFrame({ cssWidth: adopted.w, cssHeight: adopted.h, dpr: adopted.dpr, virtualHeight: fid.virtualHeight });
        if (canvas.width !== frame.deviceWidth || canvas.height !== frame.deviceHeight) {
          canvas.width = frame.deviceWidth;
          canvas.height = frame.deviceHeight;
        }
        post.resize(frame);

        const k = reducedMotion ? 1 : 0.08;
        pointerSmooth.x += (pointerNorm.x - pointerSmooth.x) * k;
        pointerSmooth.y += (pointerNorm.y - pointerSmooth.y) * k;
        const parallaxTilt = reducedMotion ? 0 : 0.6;
        const rxDeg = fid.tilt * 0.45 - pointerSmooth.y * fid.tilt * parallaxTilt;
        const ryDeg = pointerSmooth.x * fid.tilt * parallaxTilt;
        tilt = {
          rx: (rxDeg * Math.PI) / 180,
          ry: (ryDeg * Math.PI) / 180,
          aspect: frame.aspect,
          dist: PERSPECTIVE_DIST,
          shrink: 1 - 0.008 * fid.tilt,
        };

        const input: Input = {
          pointer: { ...pointer },
          keysJustPressed,
          keysDown,
          frame: { width: frame.logicalWidth, height: frame.logicalHeight },
        };
        game.update(dt, input, time);
        painter.beginFrame(frame, time, { bevel: fid.bevel });
        game.draw(painter);
        post.upload(layers, frame.vw, frame.vh);
        // Reduced motion also freezes the temporal grain and dither.
        post.render(frame, { fidelity: fid, pointer: pointerSmooth, time: reducedMotion ? 0 : time, tilt });
      } catch (err) {
        console.error('ConsoleStage: frame failed, stopping', err);
        running = false;
        setSupported(false);
        return false;
      } finally {
        pointer.justPressed = false;
        pointer.justReleased = false;
        keysJustPressed = new Set();
      }
      return true;
    };

    const tick = (now: number) => {
      raf = 0;
      if (!running) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      fpsFrames++;
      if (!fpsStart) fpsStart = now;
      else if (now - fpsStart >= 1000) {
        fps = (fpsFrames * 1000) / (now - fpsStart);
        fpsFrames = 0;
        fpsStart = now;
      }
      if (renderFrame(dt)) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf && running) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    post.onContextLost = stop;
    post.onContextRestored = () => {
      if (!document.hidden) start();
    };
    start();

    if (import.meta.env.DEV) {
      (canvas as HTMLCanvasElement & { __console?: unknown }).__console = {
        get stats() {
          return { fps: Math.round(fps), elapsed: +elapsed.toFixed(2), frame, post: post.stats, fidelity: applyLimits(fidelityAt(elapsed, duration), limits) };
        },
        /** Renders synchronously (QA in environments where requestAnimationFrame is paused). */
        step: (dt = 1 / 60, frames = 1) => {
          for (let i = 0; i < frames; i++) if (!renderFrame(dt)) break;
        },
        /** Logical pointer state after the last pointer event (checks the tilt inverse mapping). */
        get pointer() {
          return { ...pointer, tilt };
        },
        /** Simulates a click at logical coordinates. */
        click: (x: number, y: number) => {
          pointer.x = x;
          pointer.y = y;
          pointer.inside = true;
          pointer.justPressed = true;
          pointer.down = true;
          renderFrame(1 / 60);
          pointer.down = false;
        },
      };
    }

    return () => {
      running = false;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('lostpointercapture', onCancel);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      game.dispose?.();
      post.dispose();
    };
    // The stage is bound to its mount; changing props does not restart the ramp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        aria-hidden={supported === false}
        hidden={supported === false}
      />
      {supported === false && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-500 px-6 text-center" style={{ fontFamily: 'monospace' }}>
            This browser cannot draw WebGL2, so the game console stays off.
          </p>
        </div>
      )}
      {era && (
        <div
          key={era.n}
          className="console-era-tag pointer-events-none absolute left-4 bottom-4 text-[10px] tracking-[0.3em] text-white/70"
          style={{ fontFamily: 'monospace', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}
          aria-hidden="true"
        >
          {ERA_LABEL[era.era]}
        </div>
      )}
    </div>
  );
};

export default ConsoleStage;
