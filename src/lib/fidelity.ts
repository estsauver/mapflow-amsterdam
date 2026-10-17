/**
 * The fidelity ramp: how a project game's rendering evolves from an 8-bit
 * console to a modern, lit, bloomed render while you watch.
 *
 * Pure function of elapsed time so it can be tested and reused. The console
 * stage renders each game at `virtualHeight` lines and post-processes it on
 * the GPU with the remaining parameters.
 */

export const FIDELITY_ERAS = ['eight-bit', 'sixteen-bit', 'early-3d', 'modern'] as const;
export type FidelityEra = (typeof FIDELITY_ERAS)[number];

/** Seconds from fully retro to fully modern. */
export const FIDELITY_DURATION = 24;

export interface FidelityParams {
  era: FidelityEra;
  /** Rendered height in pixels before upscaling (216 = 8-bit console, 1080 = full). */
  virtualHeight: number;
  /** Colour levels per channel. 256 means no quantisation. Integer. */
  posterizeLevels: number;
  /** Ordered-dither strength applied with the quantisation, 0..1. */
  dither: number;
  /** CRT scanline strength, 0..1. */
  scanlines: number;
  /** CRT aperture-grille strength, 0..1. */
  mask: number;
  /** CRT barrel distortion, 0..~0.1. */
  barrel: number;
  /** 0 = nearest-neighbour upscaling, 1 = smooth bicubic. */
  smooth: number;
  /** Pixel-art sprites drawn as flat pixels (0) or bevelled lit tiles (1). */
  bevel: number;
  /** Layer parallax amount, 0..1. */
  parallax: number;
  saturation: number;
  contrast: number;
  /** Bloom strength, 0..1. */
  bloom: number;
  /** Relief lighting strength, 0..1. */
  lighting: number;
  /** Perspective tilt in degrees. */
  tilt: number;
  /** Film grain opacity, 0..1. */
  grain: number;
  /** Vignette opacity, 0..1. */
  vignette: number;
  /** Chromatic aberration offset in output pixels. */
  aberration: number;
}

type Key = [u: number, value: number];

// Normalised time u ∈ [0, 1]. Tracks the tests require to be monotone are:
// virtualHeight ↑, posterizeLevels ↑, smooth ↑, bevel ↑, parallax ↑, bloom ↑,
// lighting ↑, dither ↓, scanlines ↓, mask ↓, barrel ↓.
const TRACKS: Record<Exclude<keyof FidelityParams, 'era'>, Key[]> = {
  virtualHeight:   [[0, 216], [0.15, 216], [0.22, 360], [0.4, 360], [0.47, 540], [0.7, 540], [0.8, 1080], [1, 1080]],
  posterizeLevels: [[0, 4], [0.1, 4], [0.2, 8], [0.3, 16], [0.4, 32], [0.55, 64], [0.7, 256], [1, 256]],
  dither:          [[0, 1], [0.4, 1], [0.7, 0.25], [0.85, 0], [1, 0]],
  scanlines:       [[0, 0.5], [0.15, 0.5], [0.4, 0.2], [0.7, 0], [1, 0]],
  mask:            [[0, 0.35], [0.15, 0.35], [0.4, 0.22], [0.7, 0], [1, 0]],
  barrel:          [[0, 0.07], [0.4, 0.045], [0.7, 0], [1, 0]],
  smooth:          [[0, 0], [0.4, 0], [0.55, 1], [1, 1]],
  bevel:           [[0, 0], [0.55, 0], [0.8, 0.6], [1, 1]],
  parallax:        [[0, 0], [0.6, 0], [0.85, 0.7], [1, 1]],
  saturation:      [[0, 0.85], [0.4, 0.95], [0.7, 1.0], [1, 1.08]],
  contrast:        [[0, 1.18], [0.4, 1.08], [0.7, 1.0], [1, 1.0]],
  bloom:           [[0, 0], [0.55, 0], [0.8, 0.45], [1, 0.7]],
  lighting:        [[0, 0], [0.45, 0], [0.75, 0.45], [1, 0.75]],
  tilt:            [[0, 0], [0.4, 0], [0.55, 7], [0.7, 4], [1, 2.5]],
  grain:           [[0, 0.16], [0.4, 0.12], [0.7, 0.07], [1, 0.04]],
  vignette:        [[0, 0.55], [0.4, 0.45], [0.7, 0.3], [1, 0.25]],
  aberration:      [[0, 0], [0.4, 0], [0.55, 1.0], [0.7, 0.4], [0.85, 0.3], [1, 0.3]],
};

const ERA_STARTS: [u: number, era: FidelityEra][] = [
  [0, 'eight-bit'],
  [0.15, 'sixteen-bit'],
  [0.4, 'early-3d'],
  [0.7, 'modern'],
];

const smoothstep = (x: number) => x * x * (3 - 2 * x);

function evalTrack(keys: Key[], u: number): number {
  if (u <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (u >= last[0]) return last[1];
  for (let i = 1; i < keys.length; i++) {
    const [u1, v1] = keys[i];
    if (u <= u1) {
      const [u0, v0] = keys[i - 1];
      const t = smoothstep((u - u0) / (u1 - u0));
      return v0 + (v1 - v0) * t;
    }
  }
  return last[1];
}

function eraAt(u: number): FidelityEra {
  let era: FidelityEra = ERA_STARTS[0][1];
  for (const [start, e] of ERA_STARTS) if (u >= start) era = e;
  return era;
}

export function fidelityAt(seconds: number, duration: number = FIDELITY_DURATION): FidelityParams {
  if (!(duration > 0)) throw new Error(`fidelity duration must be positive, got ${duration}`);
  const u = Math.min(1, Math.max(0, seconds / duration));
  const v = (k: Exclude<keyof FidelityParams, 'era'>) => evalTrack(TRACKS[k], u);
  return {
    era: eraAt(u),
    virtualHeight: v('virtualHeight'),
    posterizeLevels: Math.round(v('posterizeLevels')),
    dither: v('dither'),
    scanlines: v('scanlines'),
    mask: v('mask'),
    barrel: v('barrel'),
    smooth: v('smooth'),
    bevel: v('bevel'),
    parallax: v('parallax'),
    saturation: v('saturation'),
    contrast: v('contrast'),
    bloom: v('bloom'),
    lighting: v('lighting'),
    tilt: v('tilt'),
    grain: v('grain'),
    vignette: v('vignette'),
    aberration: v('aberration'),
  };
}

/** The fully modern end state, identical to fidelityAt(duration). */
export function fidelityFinal(): FidelityParams {
  return fidelityAt(FIDELITY_DURATION);
}

export type FidelityLimitKey = Exclude<keyof FidelityParams, 'era' | 'virtualHeight' | 'posterizeLevels'>;

/** Per-game caps (min with the curve), e.g. a light-themed game wants less bloom. */
export function applyLimits(p: FidelityParams, limits?: Partial<Record<FidelityLimitKey, number>>): FidelityParams {
  if (!limits) return p;
  const out = { ...p };
  for (const k of Object.keys(limits) as FidelityLimitKey[]) {
    const lim = limits[k];
    if (typeof lim === 'number') out[k] = Math.min(out[k], lim);
  }
  return out;
}
