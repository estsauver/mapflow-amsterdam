import { describe, it, expect } from 'vitest';
import { FIDELITY_DURATION, FIDELITY_ERAS, applyLimits, fidelityAt, fidelityFinal } from '../fidelity';

// The fidelity ramp drives the rendering of the project games from a brief
// 16-bit nod to a cinematic, physically-flavoured render. These tests pin the
// shape of the curve rather than exact numbers.

const sample = (duration: number, stepSeconds: number) => {
  const out = [] as ReturnType<typeof fidelityAt>[];
  for (let t = 0; t <= duration + 1e-9; t += stepSeconds) out.push(fidelityAt(t, duration));
  return out;
};

describe('fidelityAt', () => {
  it('starts as a tasteful 16-bit console, never 8-bit mud', () => {
    for (const t of [0, -1, -100]) {
      const f = fidelityAt(t);
      expect(f.era).toBe('sixteen-bit');
      expect(f.virtualHeight).toBeGreaterThanOrEqual(360);
      expect(f.virtualHeight).toBeLessThanOrEqual(400);
      expect(f.posterizeLevels).toBeGreaterThanOrEqual(16);
      expect(f.posterizeLevels).toBeLessThanOrEqual(32);
      expect(f.dither).toBeLessThanOrEqual(0.7);
      expect(f.scanlines).toBeLessThanOrEqual(0.3);
      expect(f.mask).toBeLessThanOrEqual(0.15);
      expect(f.barrel).toBeLessThanOrEqual(0.04);
      expect(f.grain).toBeLessThanOrEqual(0.08);
      expect(f.smooth).toBe(0);
      expect(f.bloom).toBe(0);
      expect(f.lighting).toBe(0);
      for (const k of ['dof', 'fog', 'shadows', 'shafts', 'flare', 'dust', 'grade'] as const) expect(f[k]).toBe(0);
    }
  });

  it('spends most of the ramp past the retro look', () => {
    const s = sample(FIDELITY_DURATION, 0.1);
    const retro = s.filter(f => f.era === 'sixteen-bit').length / s.length;
    expect(retro).toBeLessThan(0.15);
    const highEnd = s.filter(f => f.era === 'ray-traced' || f.era === 'cinematic').length / s.length;
    expect(highEnd).toBeGreaterThan(0.5);
  });

  it('ends cinematic at t >= duration and matches fidelityFinal()', () => {
    const final = fidelityFinal();
    for (const t of [FIDELITY_DURATION, FIDELITY_DURATION + 5, 1e6]) {
      expect(fidelityAt(t)).toEqual(final);
    }
    expect(final.era).toBe('cinematic');
    expect(final.virtualHeight).toBeGreaterThanOrEqual(1080);
    expect(final.posterizeLevels).toBe(256);
    expect(final.dither).toBe(0);
    expect(final.scanlines).toBe(0);
    expect(final.mask).toBe(0);
    expect(final.barrel).toBe(0);
    expect(final.smooth).toBe(1);
    expect(final.bevel).toBe(1);
    expect(final.parallax).toBe(1);
    expect(final.grain).toBeLessThanOrEqual(0.03);
    for (const k of ['bloom', 'lighting', 'dof', 'fog', 'shadows', 'shafts', 'flare', 'dust', 'grade'] as const) {
      expect(final[k], k).toBeGreaterThan(0.5);
    }
  });

  it('only ever increases fidelity over time', () => {
    const s = sample(FIDELITY_DURATION, 0.1);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i];
      for (const k of ['virtualHeight', 'posterizeLevels', 'smooth', 'bevel', 'parallax', 'bloom', 'lighting', 'dof', 'fog', 'shadows', 'shafts', 'flare', 'dust', 'grade'] as const) {
        expect(b[k], `${k} at ${i}`).toBeGreaterThanOrEqual(a[k]);
      }
      for (const k of ['dither', 'scanlines', 'mask', 'barrel', 'grain'] as const) {
        expect(b[k], `${k} at ${i}`).toBeLessThanOrEqual(a[k]);
      }
    }
  });

  it('reaches full resolution within the first third of the ramp', () => {
    expect(fidelityAt(FIDELITY_DURATION / 3).virtualHeight).toBeGreaterThanOrEqual(1080);
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
      for (const k of ['dither', 'scanlines', 'mask', 'smooth', 'bevel', 'parallax', 'bloom', 'lighting', 'saturation', 'contrast', 'vignette', 'grain', 'aberration', 'dof', 'fog', 'shadows', 'shafts', 'flare', 'dust', 'grade'] as const) {
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

  it('is a minimum with the curve, not an assignment', () => {
    const start = fidelityAt(0);
    expect(applyLimits(start, { bloom: 0.5, lighting: 1 }).bloom).toBe(0);
    expect(applyLimits(start, { bloom: 0.5, lighting: 1 }).lighting).toBe(0);
    expect(applyLimits(start, { vignette: 0.2 }).vignette).toBe(0.2);
    const final = fidelityFinal();
    expect(applyLimits(final, { vignette: 0.9 }).vignette).toBe(final.vignette);
    expect(final.bloom).toBeGreaterThan(0); // the input is not mutated by capping
  });
});
