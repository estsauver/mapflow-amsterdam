import { describe, it, expect } from 'vitest';
import { AdaptiveResolution } from '../blackhole/adaptiveResolution';

// The black hole ray-marcher is fill-rate bound. This controller trades internal
// render resolution for frame time so the scene stays smooth on weak GPUs.

const feed = (ctl: AdaptiveResolution, frameMs: number, n: number) => {
  let s = ctl.scale;
  for (let i = 0; i < n; i++) s = ctl.record(frameMs);
  return s;
};

describe('AdaptiveResolution', () => {
  it('starts at the maximum scale', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1 });
    expect(ctl.scale).toBe(1);
  });

  it('drops resolution under sustained slow frames and never goes below min', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    const after = feed(ctl, 40, 60);
    expect(after).toBeLessThan(1);
    feed(ctl, 40, 2000);
    expect(ctl.scale).toBeCloseTo(0.4, 10);
  });

  it('recovers resolution under sustained fast frames and never exceeds max', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    feed(ctl, 40, 400);
    expect(ctl.scale).toBeLessThan(0.6);
    feed(ctl, 5, 2000);
    expect(ctl.scale).toBe(1);
  });

  it('ignores a single spike', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    feed(ctl, 8, 40);
    ctl.record(250);
    feed(ctl, 8, 10);
    expect(ctl.scale).toBe(1);
  });

  it('does not oscillate when frames sit near the target', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    const changes: number[] = [];
    let last = ctl.scale;
    for (let i = 0; i < 2000; i++) {
      const s = ctl.record(16 + (i % 3)); // 16, 17, 18 ms
      if (s !== last) changes.push(s);
      last = s;
    }
    expect(changes.length).toBeLessThanOrEqual(1);
  });

  it('waits at least one window between consecutive changes', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    const frames: number[] = [];
    let last = ctl.scale;
    for (let i = 0; i < 400; i++) {
      const s = ctl.record(40);
      if (s !== last) frames.push(i);
      last = s;
    }
    expect(frames.length).toBeGreaterThan(1);
    for (let i = 1; i < frames.length; i++) expect(frames[i] - frames[i - 1]).toBeGreaterThanOrEqual(20);
  });

  it('reacts within a few frames when frames are catastrophically slow', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    const first = feed(ctl, 300, 3);
    expect(first).toBeLessThan(1);
    feed(ctl, 300, 12);
    expect(ctl.scale).toBeCloseTo(0.4, 10);
  });

  it('still ignores a single spike with the emergency path armed', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20 });
    feed(ctl, 8, 5);
    ctl.record(400);
    feed(ctl, 8, 5);
    expect(ctl.scale).toBe(1);
  });

  it('treats pause-sized gaps (hidden tab) as no information', () => {
    const ctl = new AdaptiveResolution({ min: 0.4, max: 1, targetFrameMs: 16.7, window: 20, pauseThresholdMs: 400 });
    feed(ctl, 1000, 50);
    expect(ctl.scale).toBe(1);
    feed(ctl, 399, 50);
    expect(ctl.scale).toBeLessThan(1);
  });

  it('rejects a min above max', () => {
    expect(() => new AdaptiveResolution({ min: 1, max: 0.5 })).toThrow();
  });
});
