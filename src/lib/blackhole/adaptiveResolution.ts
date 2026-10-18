/**
 * Dynamic resolution controller for the ray-marched black hole.
 *
 * Feed it one frame time per rendered frame; read `scale` (0..1) and size the
 * internal framebuffer by it. It looks at the median of a sliding window (so a
 * single hitch does not change anything), steps the scale one notch at a time,
 * and waits a full window between changes so it cannot oscillate.
 */
export interface AdaptiveResolutionOptions {
  min?: number;
  max?: number;
  /** Frame budget. Default is one 60 Hz frame. */
  targetFrameMs?: number;
  /** Frames considered per decision, and minimum frames between decisions. */
  window?: number;
  /** Scale change per decision. */
  step?: number;
  /** Step down when the median exceeds target × downRatio. */
  downRatio?: number;
  /** Step up when the median is below target × upRatio. */
  upRatio?: number;
  /**
   * When the median exceeds target × emergencyRatio, step down two notches as
   * soon as three frames are in, instead of waiting for a full window.
   */
  emergencyRatio?: number;
  /**
   * Samples at or above this are treated as a pause (hidden tab, throttled
   * window, breakpoint) rather than a slow frame, and ignored.
   */
  pauseThresholdMs?: number;
}

export class AdaptiveResolution {
  readonly min: number;
  readonly max: number;
  readonly targetFrameMs: number;
  readonly window: number;
  readonly step: number;
  readonly downRatio: number;
  readonly upRatio: number;
  readonly emergencyRatio: number;
  readonly pauseThresholdMs: number;

  private level = 0;
  private readonly maxLevel: number;
  private samples: number[] = [];
  private sinceChange = 0;

  constructor(opts: AdaptiveResolutionOptions = {}) {
    this.min = opts.min ?? 0.5;
    this.max = opts.max ?? 1;
    this.targetFrameMs = opts.targetFrameMs ?? 1000 / 60;
    this.window = opts.window ?? 30;
    this.step = opts.step ?? 0.1;
    this.downRatio = opts.downRatio ?? 1.15;
    this.upRatio = opts.upRatio ?? 0.7;
    this.emergencyRatio = opts.emergencyRatio ?? 4;
    this.pauseThresholdMs = opts.pauseThresholdMs ?? 400;
    if (!(this.min <= this.max)) throw new Error(`min (${this.min}) must not exceed max (${this.max})`);
    if (!(this.step > 0)) throw new Error('step must be positive');
    if (!(this.window >= 1)) throw new Error('window must be at least 1');
    this.maxLevel = Math.max(0, Math.ceil((this.max - this.min) / this.step - 1e-9));
  }

  get scale(): number {
    if (this.level === 0) return this.max;
    if (this.level >= this.maxLevel) return this.min;
    return this.max - this.level * this.step;
  }

  reset(): void {
    this.level = 0;
    this.samples = [];
    this.sinceChange = 0;
  }

  record(frameMs: number): number {
    if (!Number.isFinite(frameMs) || frameMs < 0 || frameMs >= this.pauseThresholdMs) return this.scale;
    this.samples.push(frameMs);
    if (this.samples.length > this.window) this.samples.shift();
    this.sinceChange++;
    if (this.samples.length >= 3 && this.sinceChange >= 3 && this.level < this.maxLevel) {
      const recent = medianOf(this.samples.slice(-Math.min(this.samples.length, Math.max(3, this.window >> 1))));
      if (recent > this.targetFrameMs * this.emergencyRatio) {
        this.level = Math.min(this.maxLevel, this.level + 2);
        this.sinceChange = 0;
        return this.scale;
      }
    }
    if (this.samples.length < this.window || this.sinceChange < this.window) return this.scale;

    const median = medianOf(this.samples);
    if (median > this.targetFrameMs * this.downRatio && this.level < this.maxLevel) {
      this.level++;
      this.sinceChange = 0;
    } else if (median < this.targetFrameMs * this.upRatio && this.level > 0) {
      this.level--;
      this.sinceChange = 0;
    }
    return this.scale;
  }
}

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
