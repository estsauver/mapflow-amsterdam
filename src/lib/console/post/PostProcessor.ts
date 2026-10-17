import type { FidelityParams } from '@/lib/fidelity';
import type { Frame } from '../layout';
import type { TiltConfig } from '../tilt';

export interface PostInput {
  fidelity: FidelityParams;
  /** Smoothed pointer, -1..1, y down. */
  pointer: { x: number; y: number };
  time: number;
  tilt: TiltConfig;
}

/**
 * What the console stage needs from a post pipeline. RetroPostProcessor is the
 * WebGL2 implementation; Canvas2DPostProcessor is the software fallback.
 */
export interface PostProcessor {
  readonly kind: 'webgl2' | 'canvas2d';
  /** True while the backing context is lost; render()/upload() no-op. */
  lost: boolean;
  onContextLost?: () => void;
  onContextRestored?: () => void;
  readonly stats: Record<string, unknown>;
  resize(frame: Frame): void;
  upload(layers: readonly HTMLCanvasElement[], vw: number, vh: number): void;
  render(frame: Frame, input: PostInput): void;
  dispose(): void;
}
