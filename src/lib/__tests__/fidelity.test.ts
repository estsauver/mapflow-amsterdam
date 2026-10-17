import { describe, it, expect } from 'vitest';
import { FIDELITY_DURATION, FIDELITY_ERAS, fidelityAt, fidelityFinal } from '../fidelity';

// The fidelity ramp drives the retro -> modern presentation of the project games.
// These tests pin the shape of the curve rather than exact numbers.

const sample = (duration: number, stepSeconds: number) => {
  const out = [] as ReturnType<typeof fidelityAt>[];
  for (let t = 0; t <= duration + 1e-9; t += stepSeconds) out.push(fidelityAt(t, duration));
  return out;
};

describe('fidelityAt', () => {
  it('starts fully retro at t <= 0', () => {
    for (const t of [0, -1, -100]) {
      const f = fidelityAt(t);
      expect(f.era).toBe('eight-bit');
      expect(f.pixelSize).toBeGreaterThanOrEqual(6);
      expect(f.posterizeLevels).toBeLessThanOrEqual(6);
      expect(f.scanlines).toBeGreaterThan(0.3);
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
    expect(final.pixelSize).toBe(1);
    expect(final.posterizeLevels).toBe(256);
    expect(final.scanlines).toBe(0);
    expect(final.bloom).toBeGreaterThan(0);
    expect(final.lighting).toBeGreaterThan(0);
  });

  it('only ever increases fidelity over time', () => {
    const s = sample(FIDELITY_DURATION, 0.1);
    for (let i = 1; i < s.length; i++) {
      expect(s[i].pixelSize).toBeLessThanOrEqual(s[i - 1].pixelSize);
      expect(s[i].posterizeLevels).toBeGreaterThanOrEqual(s[i - 1].posterizeLevels);
      expect(s[i].scanlines).toBeLessThanOrEqual(s[i - 1].scanlines);
      expect(s[i].bloom).toBeGreaterThanOrEqual(s[i - 1].bloom);
      expect(s[i].lighting).toBeGreaterThanOrEqual(s[i - 1].lighting);
    }
  });

  it('gets text readable (pixelSize <= 2) within the first quarter of the ramp', () => {
    expect(fidelityAt(FIDELITY_DURATION * 0.25).pixelSize).toBeLessThanOrEqual(2);
  });

  it('passes through every era in order', () => {
    const s = sample(FIDELITY_DURATION, 0.05);
    const seen = [] as string[];
    for (const f of s) if (seen[seen.length - 1] !== f.era) seen.push(f.era);
    expect(seen).toEqual([...FIDELITY_ERAS]);
  });

  it('is continuous at 60fps (no visible pops) apart from integer pixel steps', () => {
    const s = sample(FIDELITY_DURATION, 1 / 60);
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1], b = s[i];
      expect(Math.abs(a.pixelSize - b.pixelSize)).toBeLessThanOrEqual(1);
      expect(Math.abs(a.scanlines - b.scanlines)).toBeLessThan(0.02);
      expect(Math.abs(a.bloom - b.bloom)).toBeLessThan(0.02);
      expect(Math.abs(a.lighting - b.lighting)).toBeLessThan(0.02);
      expect(Math.abs(a.saturation - b.saturation)).toBeLessThan(0.02);
      expect(Math.abs(a.contrast - b.contrast)).toBeLessThan(0.02);
      expect(Math.abs(a.tilt - b.tilt)).toBeLessThan(0.2);
      expect(Math.abs(a.vignette - b.vignette)).toBeLessThan(0.02);
      expect(Math.abs(a.grain - b.grain)).toBeLessThan(0.02);
    }
  });

  it('scales to a custom duration and rejects a non-positive one', () => {
    expect(fidelityAt(5, 10).era).toBe(fidelityAt(FIDELITY_DURATION / 2).era);
    expect(() => fidelityAt(1, 0)).toThrow();
    expect(() => fidelityAt(1, -3)).toThrow();
  });
});
