/**
 * The fidelity ramp: how a project game's presentation evolves from an 8-bit
 * console look to a modern, lit, bloomed render while you watch.
 *
 * Pure function of elapsed time so it can be tested and reused. Rendering
 * lives in FidelityRamp.tsx.
 */

export const FIDELITY_ERAS = ['eight-bit', 'sixteen-bit', 'early-3d', 'modern'] as const;
export type FidelityEra = (typeof FIDELITY_ERAS)[number];

/** Seconds from fully retro to fully modern. */
export const FIDELITY_DURATION = 24;

export interface FidelityParams {
  era: FidelityEra;
  /** Size of a rendered "pixel" in CSS px. 1 means no pixelation. Integer. */
  pixelSize: number;
  /** Colour levels per channel. 256 means no posterisation. Integer. */
  posterizeLevels: number;
  /** CRT scanline opacity, 0..1. */
  scanlines: number;
  /** CSS saturate() factor. */
  saturation: number;
  /** CSS contrast() factor. */
  contrast: number;
  /** Bloom strength, 0..1. */
  bloom: number;
  /** Specular lighting strength, 0..1. */
  lighting: number;
  /** Perspective tilt in degrees. */
  tilt: number;
  /** Film grain opacity, 0..1. */
  grain: number;
  /** Vignette opacity, 0..1. */
  vignette: number;
  /** Chromatic aberration offset in CSS px. */
  aberration: number;
}

type Key = [u: number, value: number];

// Normalised time u ∈ [0, 1]. Every track below is monotone where the tests
// require it (pixelSize ↓, posterizeLevels ↑, scanlines ↓, bloom ↑, lighting ↑).
const TRACKS: Record<Exclude<keyof FidelityParams, 'era'>, Key[]> = {
  pixelSize:       [[0, 8], [0.08, 8], [0.25, 2], [0.4, 1], [1, 1]],
  posterizeLevels: [[0, 4], [0.1, 4], [0.2, 8], [0.3, 16], [0.4, 32], [0.55, 64], [0.7, 256], [1, 256]],
  scanlines:       [[0, 0.5], [0.15, 0.5], [0.4, 0.18], [0.7, 0], [1, 0]],
  saturation:      [[0, 0.85], [0.4, 0.95], [0.7, 1.0], [1, 1.08]],
  contrast:        [[0, 1.18], [0.4, 1.08], [0.7, 1.0], [1, 1.0]],
  bloom:           [[0, 0], [0.55, 0], [0.8, 0.45], [1, 0.7]],
  lighting:        [[0, 0], [0.45, 0], [0.75, 0.45], [1, 0.75]],
  tilt:            [[0, 0], [0.4, 0], [0.55, 7], [0.7, 4], [1, 2.5]],
  grain:           [[0, 0.16], [0.4, 0.12], [0.7, 0.07], [1, 0.04]],
  vignette:        [[0, 0.55], [0.4, 0.45], [0.7, 0.3], [1, 0.25]],
  aberration:      [[0, 0], [0.4, 0], [0.55, 1.0], [0.7, 0.4], [0.85, 0], [1, 0]],
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
  return {
    era: eraAt(u),
    pixelSize: Math.round(evalTrack(TRACKS.pixelSize, u)),
    posterizeLevels: Math.round(evalTrack(TRACKS.posterizeLevels, u)),
    scanlines: evalTrack(TRACKS.scanlines, u),
    saturation: evalTrack(TRACKS.saturation, u),
    contrast: evalTrack(TRACKS.contrast, u),
    bloom: evalTrack(TRACKS.bloom, u),
    lighting: evalTrack(TRACKS.lighting, u),
    tilt: evalTrack(TRACKS.tilt, u),
    grain: evalTrack(TRACKS.grain, u),
    vignette: evalTrack(TRACKS.vignette, u),
    aberration: evalTrack(TRACKS.aberration, u),
  };
}

/** The fully modern end state, identical to fidelityAt(duration). */
export function fidelityFinal(): FidelityParams {
  return fidelityAt(FIDELITY_DURATION);
}
