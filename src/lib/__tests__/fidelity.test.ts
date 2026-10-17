import { describe, it, expect } from 'vitest';
import { FIDELITY_DURATION, FIDELITY_ERAS, applyLimits, fidelityAt, fidelityFinal } from '../fidelity';

// The fidelity ramp drives the retro -> modern rendering of the project games.
// These tests pin the shape of the curve rather than exact numbers.

const sample = (duration: number, stepSeconds: number) => {
  const out = [] as ReturnType<typeof fidelityAt>[];
  for (let t = 0; t <= duration + 1e-9; t += stepSeconds) out.push(fidelityAt(t, duration));
  return out;
};

describe('fidelityAt', () => {
  it('starts as an 8-bit console at t <= 0', () => {
    for (const t of [0, -1, -100]) {
      const f = fidelityAt(t);
      expect(f.era).toBe('eight-bit');
      expect(f.virtualHeight).toBeLessThanOrEqual(240);
      expect(f.posterizeLevels).toBeLessThanOrEqual(6);
      expect(f.dither).toBeGreaterThanOrEqual(0.9);
      expect(f.scanlines).toBeGreaterThan(0.3);
      expect(f.mask).toBeGreaterThan(0);
      expect(f.smooth).toBe(0);
      expect(f.bevel).toBe(0);
      expect(f.parallax).toBe(0);
      expect(f.bloom).toBe(0);
      expect(f.lighting).toBe(0);
    }
  });

  it('ends fully modern at t >= duration and matches fidelityFinal()', () => {
    const final = fidelityFinal();
    for (const t of [FIDELITY_DURATION, FIDELITY_DURATION + 5, 1e6]) {
      expect(fidelityAt(t)).toEqual(final);
    }
    expect(final.era).toBe('modern');
    expect(final.virtualHeight).toBeGreaterThanOrEqual(1080);
    expect(final.posterizeLevels).toBe(256);
    expect(final.dither).toBe(0);
    expect(final.scanlines).toBe(0);
    expect(final.mask).toBe(0);
    expect(final.barrel).toBe(0);
    expect(final.smooth).toBe(1);
    expect(final.bevel).toBe(1);
    expect(final.parallax).toBe(1);
    expect(final.bloom).toBeGreaterThan(0);
    expect(final.lighting).toBeGreaterThan(0);
  });

  it('only ever increases fidelity over time', () => {
    const s = sample(FIDELITY_DURATION, 0.1);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i];
      expect(b.virtualHeight).toBeGreaterThanOrEqual(a.virtualHeight);
      expect(b.posterizeLevels).toBeGreaterThanOrEqual(a.posterizeLevels);
      expect(b.smooth).toBeGreaterThanOrEqual(a.smooth);
      expect(b.bevel).toBeGreaterThanOrEqual(a.bevel);
      expect(b.parallax).toBeGreaterThanOrEqual(a.parallax);
      expect(b.bloom).toBeGreaterThanOrEqual(a.bloom);
      expect(b.lighting).toBeGreaterThanOrEqual(a.lighting);
      expect(b.dither).toBeLessThanOrEqual(a.dither);
      expect(b.scanlines).toBeLessThanOrEqual(a.scanlines);
      expect(b.mask).toBeLessThanOrEqual(a.mask);
      expect(b.barrel).toBeLessThanOrEqual(a.barrel);
    }
  });

  it('reaches a readable 360 lines within the first quarter of the ramp', () => {
    expect(fidelityAt(FIDELITY_DURATION * 0.25).virtualHeight).toBeGreaterThanOrEqual(360);
  });

  it('passes through every era in order', () => {
    const s = sample(FIDELITY_DURATION, 0.05);
    const seen = [] as string[];
    for (const f of s) if (seen[seen.length - 1] !== f.era) seen.push(f.era);
    expect(seen).toEqual([...FIDELITY_ERAS]);
  });

  it('is continuous at 60fps (no visible pops)', () => {
    const s = sample(FIDELITY_DURATION, 1 / 60);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i];
      expect(Math.abs(a.virtualHeight - b.virtualHeight)).toBeLessThan(8);
      for (const k of ['dither', 'scanlines', 'mask', 'smooth', 'bevel', 'parallax', 'bloom', 'lighting', 'saturation', 'contrast', 'vignette', 'grain', 'aberration'] as const) {
        expect(Math.abs(a[k] - b[k]), k).toBeLessThan(0.03);
      }
      expect(Math.abs(a.barrel - b.barrel)).toBeLessThan(0.005);
      expect(Math.abs(a.tilt - b.tilt)).toBeLessThan(0.2);
    }
  });

  it('scales to a custom duration and rejects a non-positive one', () => {
    expect(fidelityAt(5, 10).era).toBe(fidelityAt(FIDELITY_DURATION / 2).era);
    expect(() => fidelityAt(1, 0)).toThrow();
    expect(() => fidelityAt(1, -3)).toThrow();
  });
});

describe('applyLimits', () => {
  it('caps parameters without touching the rest', () => {
    const f = fidelityFinal();
    const capped = applyLimits(f, { bloom: 0.2, tilt: 0 });
    expect(capped.bloom).toBe(0.2);
    expect(capped.tilt).toBe(0);
    expect(capped.lighting).toBe(f.lighting);
    expect(applyLimits(f)).toEqual(f);
  });
});
