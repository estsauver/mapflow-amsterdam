import { describe, it, expect } from 'vitest';
import { LOGICAL_HEIGHT, computeFrame, spritePixelSize } from '../console/layout';
import { planeFromScreen, screenFromPlane } from '../console/tilt';

describe('computeFrame', () => {
  it('keeps the logical height fixed and derives width from the aspect ratio', () => {
    const f = computeFrame({ cssWidth: 1600, cssHeight: 900, dpr: 2, virtualHeight: 216 });
    expect(f.logicalHeight).toBe(LOGICAL_HEIGHT);
    expect(f.logicalWidth).toBeCloseTo((1600 / 900) * LOGICAL_HEIGHT, 6);
    expect(f.vh).toBe(216);
    expect(f.vw).toBe(Math.round(216 * (1600 / 900)));
    expect(f.scale).toBeCloseTo(216 / LOGICAL_HEIGHT, 10);
  });

  it('never exceeds the device resolution and caps the device width', () => {
    const f = computeFrame({ cssWidth: 3000, cssHeight: 1500, dpr: 2, virtualHeight: 5000, maxDeviceWidth: 1920 });
    expect(f.deviceWidth).toBe(1920);
    expect(f.deviceHeight).toBe(960);
    expect(f.vh).toBe(960);
    expect(f.vw).toBe(1920);
  });

  it('caps portrait containers by height, preserving the aspect ratio', () => {
    const f = computeFrame({ cssWidth: 1026, cssHeight: 1728, dpr: 2, virtualHeight: 1080 });
    expect(f.deviceHeight).toBe(1080);
    expect(f.deviceWidth * f.deviceHeight).toBeLessThanOrEqual(1920 * 1080);
    expect(f.deviceWidth / f.deviceHeight).toBeCloseTo(1026 / 1728, 2);
    expect(f.vw).toBeLessThanOrEqual(f.deviceWidth);
  });

  it('never renders more virtual lines than the device has', () => {
    const f = computeFrame({ cssWidth: 300, cssHeight: 60, dpr: 1, virtualHeight: 216 });
    expect(f.vh).toBeLessThanOrEqual(f.deviceHeight);
    expect(f.vw).toBeLessThanOrEqual(f.deviceWidth);
    const g = computeFrame({ cssWidth: 300, cssHeight: 4, dpr: 1, virtualHeight: 216 });
    expect(g.vh).toBeLessThanOrEqual(g.deviceHeight);
  });

  it('refuses degenerate sizes', () => {
    expect(() => computeFrame({ cssWidth: 0, cssHeight: 900, dpr: 1, virtualHeight: 216 })).toThrow();
    expect(() => computeFrame({ cssWidth: 900, cssHeight: 900, dpr: 1, virtualHeight: 0 })).toThrow();
  });
});

describe('spritePixelSize', () => {
  it('snaps art pixels to whole virtual pixels and never drops below one', () => {
    expect(spritePixelSize(0.4, 4)).toBe(2);
    expect(spritePixelSize(1, 4)).toBe(4);
    expect(spritePixelSize(0.1, 1)).toBe(1);
  });
});

describe('perspective tilt mapping', () => {
  const cfg = { rx: 0.08, ry: -0.05, aspect: 1.6, dist: 2.8, shrink: 0.97 };

  it('is the identity when there is no tilt and no shrink', () => {
    const flat = { rx: 0, ry: 0, aspect: 1.6, dist: 2.8, shrink: 1 };
    const p = planeFromScreen(0.3, -0.4, flat)!;
    expect(p.u).toBeCloseTo(0.65, 9);
    expect(p.v).toBeCloseTo(0.3, 9);
  });

  it('round-trips plane -> screen -> plane', () => {
    for (const [u, v] of [[0, 0], [1, 1], [0.5, 0.5], [0.2, 0.9], [0.95, 0.1]]) {
      const s = screenFromPlane(u, v, cfg);
      const back = planeFromScreen(s.x, s.y, cfg)!;
      expect(back.u).toBeCloseTo(u, 6);
      expect(back.v).toBeCloseTo(v, 6);
    }
  });

  it('moves the near edge outward and the far edge inward', () => {
    // Positive rx tips the top edge away from the viewer, so it shrinks.
    const top = screenFromPlane(0.5, 1, { ...cfg, ry: 0, shrink: 1 });
    const bottom = screenFromPlane(0.5, 0, { ...cfg, ry: 0, shrink: 1 });
    expect(top.y).toBeLessThan(1);
    expect(Math.abs(bottom.y)).toBeGreaterThan(top.y);
  });

  it('returns null for rays parallel to the plane', () => {
    expect(planeFromScreen(0.3, 0, { rx: Math.PI / 2, ry: 0, aspect: 1, dist: 1, shrink: 1 })).toBeNull();
  });
});
