/**
 * The fidelity ramp: how a project game's rendering evolves from a brief
 * 16-bit nod through HD to a cinematic render with shadows, depth of field,
 * light shafts and lens effects while you watch.
 *
 * Pure function of elapsed time so it can be tested and reused. The console
 * stage renders each game at `virtualHeight` lines and post-processes it on
 * the GPU with the remaining parameters.
 */

export const FIDELITY_ERAS = ['sixteen-bit', 'early-3d', 'hd', 'ray-traced', 'cinematic'] as const;
export type FidelityEra = (typeof FIDELITY_ERAS)[number];

/** Seconds from the 16-bit nod to the cinematic end state. */
export const FIDELITY_DURATION = 28;

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
  /** Depth of field: blur of the background layer, 0..1. */
  dof: number;
  /** Atmospheric haze on the background layer, 0..1. */
  fog: number;
  /** Screen-space contact shadows from the moving light, 0..1. */
  shadows: number;
  /** Volumetric light shafts, 0..1. */
  shafts: number;
  /** Anamorphic lens flare, 0..1. */
  flare: number;
  /** Drifting dust motes lit by the light, 0..1. */
  dust: number;
  /** Filmic split-tone grading, 0..1. */
  grade: number;
}

type Key = [u: number, value: number];

// Normalised time u ∈ [0, 1] over FIDELITY_DURATION. Eras: 16-bit to 0.11,
// early 3D to 0.25, HD to 0.46, ray-traced to 0.71, cinematic to 1. Tracks the
// tests require to be monotone: virtualHeight, posterizeLevels, smooth, bevel,
// parallax, bloom, lighting, dof, fog, shadows, shafts, flare, dust, grade ↑;
// dither, scanlines, mask, barrel, grain ↓.
const TRACKS: Record<Exclude<keyof FidelityParams, 'era'>, Key[]> = {
  virtualHeight:   [[0, 360], [0.08, 360], [0.13, 540], [0.22, 540], [0.3, 1080], [1, 1080]],
  posterizeLevels: [[0, 16], [0.06, 16], [0.12, 32], [0.18, 64], [0.22, 256], [1, 256]],
  dither:          [[0, 0.6], [0.1, 0.6], [0.2, 0], [1, 0]],
  scanlines:       [[0, 0.25], [0.08, 0.25], [0.2, 0], [1, 0]],
  mask:            [[0, 0.12], [0.08, 0.12], [0.18, 0], [1, 0]],
  barrel:          [[0, 0.03], [0.1, 0.03], [0.2, 0], [1, 0]],
  smooth:          [[0, 0], [0.1, 0], [0.16, 1], [1, 1]],
  bevel:           [[0, 0], [0.28, 0], [0.42, 0.7], [0.6, 1], [1, 1]],
  parallax:        [[0, 0], [0.3, 0], [0.5, 0.7], [0.7, 1], [1, 1]],
  saturation:      [[0, 0.92], [0.2, 1.0], [0.7, 1.05], [1, 1.08]],
  contrast:        [[0, 1.08], [0.2, 1.02], [1, 1.0]],
  bloom:           [[0, 0], [0.25, 0], [0.4, 0.4], [0.7, 0.6], [1, 0.7]],
  lighting:        [[0, 0], [0.28, 0], [0.45, 0.5], [0.7, 0.75], [1, 0.8]],
  tilt:            [[0, 0], [0.11, 0], [0.18, 7], [0.25, 4], [1, 2.5]],
  grain:           [[0, 0.06], [0.2, 0.03], [0.7, 0.02], [1, 0.02]],
  vignette:        [[0, 0.3], [0.2, 0.25], [0.7, 0.22], [1, 0.3]],
  aberration:      [[0, 0], [0.11, 0], [0.18, 0.8], [0.25, 0.25], [0.7, 0.25], [1, 0.35]],
  dof:             [[0, 0], [0.46, 0], [0.62, 0.8], [1, 1]],
  fog:             [[0, 0], [0.5, 0], [0.7, 0.5], [1, 0.6]],
  shadows:         [[0, 0], [0.46, 0], [0.6, 0.8], [1, 1]],
  shafts:          [[0, 0], [0.7, 0], [0.85, 0.8], [1, 1]],
  flare:           [[0, 0], [0.72, 0], [0.9, 1], [1, 1]],
  dust:            [[0, 0], [0.71, 0], [0.85, 1], [1, 1]],
  grade:           [[0, 0], [0.65, 0], [0.85, 0.8], [1, 1]],
};

const ERA_STARTS: [u: number, era: FidelityEra][] = [
  [0, 'sixteen-bit'],
  [0.11, 'early-3d'],
  [0.25, 'hd'],
  [0.46, 'ray-traced'],
  [0.71, 'cinematic'],
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
    dof: v('dof'),
    fog: v('fog'),
    shadows: v('shadows'),
    shafts: v('shafts'),
    flare: v('flare'),
    dust: v('dust'),
    grade: v('grade'),
  };
}

/** The cinematic end state, identical to fidelityAt(duration). */
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
