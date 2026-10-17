import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FIDELITY_DURATION, FidelityEra, FidelityParams, fidelityAt, fidelityFinal } from '@/lib/fidelity';

/**
 * Wraps a DOM-rendered game and evolves its presentation from an 8-bit console
 * look to a lit, bloomed, "modern" render over FIDELITY_DURATION seconds.
 *
 * The games draw with HTML, SVG and CSS rather than a canvas, so there is no
 * pixel buffer to post-process in WebGL. Everything here is therefore done with
 * an SVG filter chain (nearest-neighbour pixelation, posterisation, chromatic
 * aberration, bloom, specular lighting) plus CSS filters, a perspective tilt
 * and overlay layers (scanlines, vignette, a light sweep, grain). It is a
 * presentation ramp, not a re-render of the game in 3D.
 *
 * The curve itself is the pure function fidelityAt() in src/lib/fidelity.ts.
 */

type LimitKey = 'scanlines' | 'bloom' | 'lighting' | 'tilt' | 'grain' | 'vignette' | 'aberration';

interface FidelityRampProps {
  children: React.ReactNode;
  /** Seconds from fully retro to fully modern. */
  duration?: number;
  /** Per-game caps, e.g. a light-themed game wants less bloom. Applied as min(). */
  limits?: Partial<Record<LimitKey, number>>;
  /** Show the small era label when the era changes. */
  showEraTag?: boolean;
  /** Begin this many seconds into the ramp (used for previews and QA). */
  startAt?: number;
}

interface Stages {
  pixelate: boolean;
  posterize: boolean;
  aberration: boolean;
  bloom: boolean;
  lighting: boolean;
}

const ERA_LABEL: Record<FidelityEra, string> = {
  'eight-bit': '8-BIT ERA',
  'sixteen-bit': '16-BIT ERA',
  'early-3d': 'EARLY 3D ERA',
  modern: 'MODERN ERA',
};

const GRAIN_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const stagesFor = (p: FidelityParams): Stages => ({
  pixelate: p.pixelSize > 1,
  posterize: p.posterizeLevels < 64,
  aberration: p.aberration > 0.3,
  bloom: p.bloom > 0.01,
  lighting: p.lighting > 0.01,
});

const sameStages = (a: Stages, b: Stages) =>
  a.pixelate === b.pixelate && a.posterize === b.posterize && a.aberration === b.aberration && a.bloom === b.bloom && a.lighting === b.lighting;

const applyLimits = (p: FidelityParams, limits?: Partial<Record<LimitKey, number>>): FidelityParams => {
  if (!limits) return p;
  const out = { ...p };
  for (const k of Object.keys(limits) as LimitKey[]) {
    const lim = limits[k];
    if (typeof lim === 'number') out[k] = Math.min(out[k], lim);
  }
  return out;
};

const posterizeTable = (levels: number) =>
  Array.from({ length: levels }, (_, i) => (i / (levels - 1)).toFixed(4)).join(' ');

const FidelityRamp = ({ children, duration = FIDELITY_DURATION, limits, showEraTag = true, startAt = 0 }: FidelityRampProps) => {
  const rawId = useId();
  const filterId = useMemo(() => `fidelity-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId]);

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const initial = useMemo(
    () => applyLimits(reducedMotion ? fidelityFinal() : fidelityAt(startAt, duration), limits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [stages, setStages] = useState<Stages>(() => stagesFor(initial));
  const [era, setEra] = useState<FidelityEra>(initial.era);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);

  // Filter primitives updated per frame without re-rendering React.
  const floodRef = useRef<SVGFEFloodElement>(null);
  const tileClipRef = useRef<SVGFECompositeElement>(null);
  const dilateRef = useRef<SVGFEMorphologyElement>(null);
  const posterRRef = useRef<SVGFEFuncRElement>(null);
  const posterGRef = useRef<SVGFEFuncGElement>(null);
  const posterBRef = useRef<SVGFEFuncBElement>(null);
  const offsetRRef = useRef<SVGFEOffsetElement>(null);
  const offsetBRef = useRef<SVGFEOffsetElement>(null);
  const bloomBlurRef = useRef<SVGFEGaussianBlurElement>(null);
  const bloomMixRef = useRef<SVGFECompositeElement>(null);
  const lightMixRef = useRef<SVGFECompositeElement>(null);
  const pointLightRef = useRef<SVGFEPointLightElement>(null);

  const paramsRef = useRef<FidelityParams>(initial);
  const stagesRef = useRef<Stages>(stagesFor(initial));
  const pointerRef = useRef({ x: 0, y: 0 });
  const eraShownAtRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const setAttr = (el: Element | null, name: string, value: string | number) => {
      if (!el) return;
      const v = String(value);
      if (el.getAttribute(name) !== v) el.setAttribute(name, v);
    };

    let lastPixel = -1;
    let lastLevels = -1;

    const apply = (p: FidelityParams, now: number) => {
      paramsRef.current = p;
      const next = stagesFor(p);
      if (!sameStages(next, stagesRef.current)) {
        stagesRef.current = next;
        setStages(next);
      }

      const stage = stageRef.current;
      if (stage) {
        const parts: string[] = [];
        if (next.pixelate || next.posterize || next.aberration || next.bloom || next.lighting) parts.push(`url(#${filterId})`);
        if (Math.abs(p.saturation - 1) > 0.005) parts.push(`saturate(${p.saturation.toFixed(3)})`);
        if (Math.abs(p.contrast - 1) > 0.005) parts.push(`contrast(${p.contrast.toFixed(3)})`);
        stage.style.filter = parts.length ? parts.join(' ') : 'none';

        const { x, y } = pointerRef.current;
        const parallax = reducedMotion ? 0 : 0.6;
        const rx = p.tilt * 0.45 - y * p.tilt * parallax;
        const ry = x * p.tilt * parallax;
        // Counter-scale so the near edge of the tilted plane stays inside the frame
        // instead of being clipped by the root's overflow-hidden.
        const shrink = 1 - 0.008 * p.tilt;
        stage.style.transform = p.tilt > 0.05
          ? `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${shrink.toFixed(3)})`
          : 'none';
      }

      // Pixelation geometry only changes on integer steps.
      if (next.pixelate && p.pixelSize !== lastPixel) {
        lastPixel = p.pixelSize;
        const cell = p.pixelSize;
        const dot = Math.min(2, cell);
        const off = Math.max(0, Math.floor(cell / 2) - 1);
        setAttr(floodRef.current, 'x', off);
        setAttr(floodRef.current, 'y', off);
        setAttr(floodRef.current, 'width', dot);
        setAttr(floodRef.current, 'height', dot);
        setAttr(tileClipRef.current, 'width', cell);
        setAttr(tileClipRef.current, 'height', cell);
        setAttr(dilateRef.current, 'radius', Math.ceil(cell / 2));
      }
      if (next.posterize && p.posterizeLevels !== lastLevels) {
        lastLevels = p.posterizeLevels;
        const table = posterizeTable(p.posterizeLevels);
        setAttr(posterRRef.current, 'tableValues', table);
        setAttr(posterGRef.current, 'tableValues', table);
        setAttr(posterBRef.current, 'tableValues', table);
      }
      if (next.aberration) {
        setAttr(offsetRRef.current, 'dx', p.aberration.toFixed(2));
        setAttr(offsetBRef.current, 'dx', (-p.aberration).toFixed(2));
      }
      if (next.bloom) {
        setAttr(bloomBlurRef.current, 'stdDeviation', (6 + 10 * p.bloom).toFixed(1));
        setAttr(bloomMixRef.current, 'k3', (0.9 * p.bloom).toFixed(3));
      }
      if (next.lighting) {
        setAttr(lightMixRef.current, 'k3', (0.4 * p.lighting).toFixed(3));
        const w = root.clientWidth, h = root.clientHeight;
        const { x, y } = pointerRef.current;
        setAttr(pointLightRef.current, 'x', Math.round(w * (0.5 + 0.45 * x)));
        setAttr(pointLightRef.current, 'y', Math.round(h * (0.5 + 0.45 * y)));
      }

      if (scanRef.current) scanRef.current.style.opacity = p.scanlines.toFixed(3);
      if (vignetteRef.current) vignetteRef.current.style.opacity = p.vignette.toFixed(3);
      if (grainRef.current) grainRef.current.style.opacity = p.grain.toFixed(3);
      if (lightRef.current) {
        const { x, y } = pointerRef.current;
        lightRef.current.style.opacity = (0.35 * p.lighting).toFixed(3);
        lightRef.current.style.background = `radial-gradient(ellipse 60% 55% at ${(50 + 40 * x).toFixed(1)}% ${(50 + 40 * y).toFixed(1)}%, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)`;
      }

      if (tagRef.current) {
        // The tag announces era changes on a timeline; a static reduced-motion scene has none.
        const age = (now - eraShownAtRef.current) / 1000;
        const vis = showEraTag && !reducedMotion && age < 2.6 ? (age < 0.3 ? age / 0.3 : age > 2.0 ? Math.max(0, (2.6 - age) / 0.6) : 1) : 0;
        tagRef.current.style.opacity = vis.toFixed(3);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const b = root.getBoundingClientRect();
      pointerRef.current = {
        x: Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)),
        y: Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height) * 2 - 1)),
      };
      if (finished) apply(paramsRef.current, performance.now());
    };
    const onPointerLeave = () => {
      pointerRef.current = { x: 0, y: 0 };
      if (finished) apply(paramsRef.current, performance.now());
    };
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerleave', onPointerLeave);

    let finished = false;
    let raf = 0;
    let elapsed = Math.max(0, startAt);
    let last = 0;
    let currentEra: FidelityEra = initial.era;
    eraShownAtRef.current = performance.now();

    if (reducedMotion) {
      finished = true;
      apply(applyLimits(fidelityFinal(), limits), performance.now());
    } else {
      apply(initial, performance.now());
      const tick = (now: number) => {
        raf = 0;
        const dt = last ? Math.min(100, now - last) : 0;
        last = now;
        elapsed += dt / 1000;
        const p = applyLimits(fidelityAt(elapsed, duration), limits);
        if (p.era !== currentEra) {
          currentEra = p.era;
          eraShownAtRef.current = now;
          setEra(p.era);
        }
        apply(p, now);
        if (elapsed >= duration + 3) {
          finished = true; // final state applied; only pointer events update from here
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
    };
    // The ramp is intentionally bound to the mount; changing props does not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build the filter chain for the active stages. `prev` threads the result names.
  const filterChildren: React.ReactNode[] = [];
  let prev = 'SourceGraphic';
  if (stages.pixelate) {
    filterChildren.push(
      <feFlood key="px-flood" ref={floodRef} x="3" y="3" width="2" height="2" floodColor="#000" result="pxDot" />,
      <feComposite key="px-clip" ref={tileClipRef} in="pxDot" in2="pxDot" operator="over" width="8" height="8" result="pxTileSrc" />,
      <feTile key="px-tile" in="pxTileSrc" result="pxTiles" />,
      <feComposite key="px-sample" in={prev} in2="pxTiles" operator="in" result="pxSampled" />,
      <feMorphology key="px-dilate" ref={dilateRef} in="pxSampled" operator="dilate" radius="4" result="pixelated" />,
    );
    prev = 'pixelated';
  }
  if (stages.posterize) {
    filterChildren.push(
      <feComponentTransfer key="poster" in={prev} result="posterized">
        <feFuncR ref={posterRRef} type="discrete" tableValues="0 0.3333 0.6667 1" />
        <feFuncG ref={posterGRef} type="discrete" tableValues="0 0.3333 0.6667 1" />
        <feFuncB ref={posterBRef} type="discrete" tableValues="0 0.3333 0.6667 1" />
      </feComponentTransfer>,
    );
    prev = 'posterized';
  }
  if (stages.aberration) {
    filterChildren.push(
      <feColorMatrix key="ca-r" in={prev} type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="caR" />,
      <feOffset key="ca-ro" ref={offsetRRef} in="caR" dx="1" dy="0" result="caRs" />,
      <feColorMatrix key="ca-g" in={prev} type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="caG" />,
      <feColorMatrix key="ca-b" in={prev} type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="caB" />,
      <feOffset key="ca-bo" ref={offsetBRef} in="caB" dx="-1" dy="0" result="caBs" />,
      <feComposite key="ca-rg" in="caRs" in2="caG" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="caRG" />,
      <feComposite key="ca-rgb" in="caRG" in2="caBs" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="aberrated" />,
    );
    prev = 'aberrated';
  }
  if (stages.bloom) {
    filterChildren.push(
      <feComponentTransfer key="bloom-thr" in={prev} result="bloomBright">
        <feFuncR type="gamma" amplitude="1" exponent="3" offset="0" />
        <feFuncG type="gamma" amplitude="1" exponent="3" offset="0" />
        <feFuncB type="gamma" amplitude="1" exponent="3" offset="0" />
      </feComponentTransfer>,
      <feGaussianBlur key="bloom-blur" ref={bloomBlurRef} in="bloomBright" stdDeviation="8" result="bloomBlur" />,
      <feComposite key="bloom-mix" ref={bloomMixRef} in={prev} in2="bloomBlur" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" result="bloomed" />,
    );
    prev = 'bloomed';
  }
  if (stages.lighting) {
    filterChildren.push(
      <feColorMatrix key="lt-lum" in={prev} type="luminanceToAlpha" result="ltLum" />,
      <feGaussianBlur key="lt-blur" in="ltLum" stdDeviation="1.2" result="ltHeight" />,
      <feSpecularLighting
        key="lt-spec"
        in="ltHeight"
        surfaceScale="4"
        specularConstant="0.75"
        specularExponent="22"
        lightingColor="#ffffff"
        result="ltSpec"
      >
        <fePointLight ref={pointLightRef} x="400" y="300" z="260" />
      </feSpecularLighting>,
      <feComposite key="lt-mask" in="ltSpec" in2="SourceAlpha" operator="in" result="ltMasked" />,
      <feComposite key="lt-mix" ref={lightMixRef} in={prev} in2="ltMasked" operator="arithmetic" k1="0" k2="1" k3="0.3" k4="0" result="lit" />,
    );
    prev = 'lit';
  }

  return (
    <div ref={rootRef} className="relative w-full h-full overflow-hidden bg-black" style={{ perspective: '1400px' }}>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {filterChildren}
        </filter>
      </svg>

      <div
        ref={stageRef}
        className="w-full h-full"
        style={{ transformOrigin: '50% 50%', willChange: 'filter, transform', backfaceVisibility: 'hidden' }}
      >
        {children}
      </div>

      {/* Overlays. All pointer-events: none so the games stay clickable. */}
      <div
        ref={scanRef}
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px)' }}
      />
      <div
        ref={vignetteRef}
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.9) 100%)' }}
      />
      <div ref={lightRef} className="pointer-events-none absolute inset-0" style={{ mixBlendMode: 'soft-light', opacity: 0 }} />
      <div
        ref={grainRef}
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: GRAIN_URL, backgroundSize: '160px 160px', mixBlendMode: 'overlay' }}
      />
      {showEraTag && (
        <div
          ref={tagRef}
          className="pointer-events-none absolute left-4 bottom-4 text-[10px] tracking-[0.3em] text-white/70"
          style={{ fontFamily: 'monospace', opacity: 0, textShadow: '0 0 6px rgba(0,0,0,0.9)' }}
          aria-hidden="true"
        >
          {ERA_LABEL[era]}
        </div>
      )}
    </div>
  );
};

export default FidelityRamp;
