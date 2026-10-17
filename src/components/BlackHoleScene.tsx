import React, { useEffect, useRef, useState } from 'react';
import { BlackHoleRenderer } from '@/lib/blackhole/BlackHoleRenderer';

interface BlackHoleSceneProps {
  title?: string;
  subtitle?: string;
  /** Skip WebGL2 and show the pre-rendered still (for QA). */
  forceFallback?: boolean;
}

/** A frame of the real renderer, captured at 1600×946, shown when WebGL2 is unavailable. */
const STILL_SRC = '/anthropic-blackhole.jpg';

/**
 * The Anthropic "project": a ray-traced Schwarzschild black hole with a
 * relativistic accretion disk. All rendering lives in BlackHoleRenderer; this
 * component wires it to the DOM (size, pointer, visibility, lifecycle).
 *
 * Without WebGL2 the scene cannot be ray-marched, so a pre-rendered still of
 * the same scene is shown with a slow drift instead.
 */
const BlackHoleScene = ({ title = 'ANTHROPIC', subtitle = 'MTS · 2026 →', forceFallback = false }: BlackHoleSceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    if (forceFallback || !BlackHoleRenderer.isSupported()) {
      if (import.meta.env.DEV) console.info('BlackHoleScene: WebGL2 unavailable, showing the pre-rendered still');
      setSupported(false);
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: BlackHoleRenderer;
    try {
      renderer = new BlackHoleRenderer(canvas, { reducedMotion });
    } catch (err) {
      console.error('BlackHoleScene: renderer failed to start', err);
      setSupported(false);
      return;
    }
    setSupported(true);
    if (import.meta.env.DEV) (canvas as HTMLCanvasElement & { __renderer?: BlackHoleRenderer }).__renderer = renderer;

    const ro = new ResizeObserver(() => measure());
    // devicePixelRatio can change with no CSS size change (dragging between a Retina and a
    // 1x display, OS scaling). ResizeObserver does not fire for that, so watch it directly.
    let dprQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    };
    const onDprChange = () => {
      measure();
      watchDpr();
    };
    const measure = () => {
      try {
        renderer.resize(container.clientWidth, container.clientHeight, window.devicePixelRatio);
      } catch (err) {
        console.error('BlackHoleScene: renderer failed, showing the text panel instead', err);
        ro.disconnect();
        renderer.dispose();
        setSupported(false);
      }
    };
    measure();
    ro.observe(container);
    watchDpr();

    const onPointerMove = (e: PointerEvent) => {
      const b = container.getBoundingClientRect();
      renderer.setPointer(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1);
    };
    const onPointerLeave = () => renderer.setPointer(0, 0);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    const onVisibility = () => (document.hidden ? renderer.stop() : renderer.start());
    document.addEventListener('visibilitychange', onVisibility);

    renderer.start();
    return () => {
      ro.disconnect();
      dprQuery?.removeEventListener('change', onDprChange);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
    };
    // The scene is bound to its mount; a later change of forceFallback does not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="A black hole with a glowing, lensed accretion disk against a star field"
        aria-hidden={supported === false}
        hidden={supported === false}
      />
      {supported === false && (
        <img
          src={STILL_SRC}
          alt="A black hole with a glowing, lensed accretion disk against a star field"
          decoding="async"
          className="blackhole-still absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div
        className="pointer-events-none absolute left-6 bottom-6"
        style={{ fontFamily: 'monospace', textShadow: '0 0 18px rgba(0,0,0,0.9)' }}
      >
        <div className="text-white/90 text-xl tracking-[0.35em]">{title}</div>
        <div className="text-slate-400 text-[11px] tracking-[0.3em] mt-1">{subtitle}</div>
      </div>
    </div>
  );
};

export default BlackHoleScene;
