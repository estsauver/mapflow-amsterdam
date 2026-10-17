import { describe, it, expect } from 'vitest';
import { quantizeDither } from '../console/post/quantize';

const fill = (w: number, h: number, rgb: [number, number, number]) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) d.set([rgb[0], rgb[1], rgb[2], 255], i * 4);
  return d;
};

describe('quantizeDither (software twin of the compose shader)', () => {
  it('snaps every channel to one of `levels` values when dither is off', () => {
    const d = fill(8, 8, [200, 90, 10]);
    quantizeDither(d, 8, 8, 4, 0);
    const allowed = new Set([0, 85, 170, 255]);
    for (let i = 0; i < d.length; i += 4) {
      expect(allowed.has(d[i])).toBe(true);
      expect(allowed.has(d[i + 1])).toBe(true);
      expect(allowed.has(d[i + 2])).toBe(true);
      expect(d[i + 3]).toBe(255);
    }
    // 200/255*3 = 2.35 -> rounds to level 2 (170); 90 -> 1.06 -> 85; 10 -> 0.12 -> 0
    expect([d[0], d[1], d[2]]).toEqual([170, 85, 0]);
  });

  it('turns a flat mid-grey into a roughly even mix of two levels with full dither', () => {
    const d = fill(16, 16, [128, 128, 128]);
    quantizeDither(d, 16, 16, 4, 1);
    let lo = 0, hi = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] === 85) lo++;
      else if (d[i] === 170) hi++;
      else throw new Error(`unexpected value ${d[i]}`);
    }
    expect(lo).toBeGreaterThan(64);
    expect(hi).toBeGreaterThan(64);
  });

  it('is the identity at 256 levels and idempotent otherwise', () => {
    const d = fill(4, 4, [13, 200, 77]);
    const before = Array.from(d);
    quantizeDither(d, 4, 4, 256, 1);
    expect(Array.from(d)).toEqual(before);
    quantizeDither(d, 4, 4, 8, 0);
    const once = Array.from(d);
    quantizeDither(d, 4, 4, 8, 0);
    expect(Array.from(d)).toEqual(once);
  });

  it('rejects fewer than two levels', () => {
    expect(() => quantizeDither(fill(1, 1, [0, 0, 0]), 1, 1, 1, 0)).toThrow();
  });
});
