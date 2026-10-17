import type { Frame } from '../layout';
import type { PostInput, PostProcessor } from './PostProcessor';
import { quantizeDither } from './quantize';

/** Above this many virtual pixels the per-pixel palette pass is skipped to keep frames cheap. */
const QUANTIZE_PIXEL_BUDGET = 300_000;

/**
 * Software fallback for the console post pipeline, used when WebGL2 is not
 * available. It keeps the parts of the ramp a 2D canvas can do well: parallax,
 * palette quantisation with ordered dither (at console resolutions), nearest or
 * bilinear upscaling, scanlines, aperture grille, vignette, a cheap bloom and
 * grain. The perspective tilt, barrel distortion, relief lighting and
 * chromatic aberration are GPU-only and are not reproduced here.
 */
export class Canvas2DPostProcessor implements PostProcessor {
  readonly kind = 'canvas2d' as const;
  lost = false;
  onContextLost?: () => void;
  onContextRestored?: () => void;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly compose = document.createElement('canvas');
  private readonly composeCtx: CanvasRenderingContext2D;
  private readonly bloomA = document.createElement('canvas');
  private readonly bloomB = document.createElement('canvas');
  private readonly bloomACtx: CanvasRenderingContext2D;
  private readonly bloomBCtx: CanvasRenderingContext2D;
  private readonly grain: CanvasPattern | null;
  private readonly grille: CanvasPattern | null;
  private readonly filterSupported: boolean;
  private layers: readonly HTMLCanvasElement[] = [];
  private deviceWidth = 0;
  private deviceHeight = 0;
  private quantized = false;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2D canvas is not available');
    this.ctx = ctx;
    const cc = this.compose.getContext('2d', { willReadFrequently: true });
    const ba = this.bloomA.getContext('2d');
    const bb = this.bloomB.getContext('2d');
    if (!cc || !ba || !bb) throw new Error('2D scratch canvases are not available');
    this.composeCtx = cc;
    this.bloomACtx = ba;
    this.bloomBCtx = bb;
    this.filterSupported = 'filter' in ctx;
    this.grain = makeGrainPattern(ctx);
    this.grille = makeGrillePattern(ctx);
  }

  get stats() {
    return { kind: this.kind, hdr: false, gpuMs: 0, gpuTimed: false, deviceWidth: this.deviceWidth, deviceHeight: this.deviceHeight, quantized: this.quantized, filters: this.filterSupported };
  }

  resize(frame: Frame): void {
    if (frame.deviceWidth === this.deviceWidth && frame.deviceHeight === this.deviceHeight) return;
    this.deviceWidth = frame.deviceWidth;
    this.deviceHeight = frame.deviceHeight;
    this.compose.width = frame.deviceWidth;
    this.compose.height = frame.deviceHeight;
    this.bloomA.width = this.bloomB.width = Math.max(1, Math.ceil(frame.deviceWidth / 4));
    this.bloomA.height = this.bloomB.height = Math.max(1, Math.ceil(frame.deviceHeight / 4));
  }

  upload(layers: readonly HTMLCanvasElement[]): void {
    // The layer canvases are read directly at render time; nothing to copy.
    this.layers = layers;
  }

  render(frame: Frame, input: PostInput): void {
    if (this.layers.length !== 3 || !this.deviceWidth) return;
    const f = input.fidelity;
    const { vw, vh } = frame;
    const W = this.deviceWidth, H = this.deviceHeight;

    // 1. Compose the layers at virtual resolution with parallax (same offsets as the shader).
    const cc = this.composeCtx;
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalCompositeOperation = 'source-over';
    cc.globalAlpha = 1;
    cc.imageSmoothingEnabled = false;
    cc.fillStyle = '#000';
    cc.fillRect(0, 0, vw, vh);
    const shift = ((10 * vh) / 540) * f.parallax;
    const sx = input.pointer.x * shift, sy = input.pointer.y * shift;
    cc.drawImage(this.layers[0], 0, 0, vw, vh, Math.round(0.6 * sx), Math.round(0.6 * sy), vw, vh);
    cc.drawImage(this.layers[1], 0, 0, vw, vh, 0, 0, vw, vh);
    cc.drawImage(this.layers[2], 0, 0, vw, vh, Math.round(-0.9 * sx), Math.round(-0.9 * sy), vw, vh);

    // 2. Palette + dither, only while the frame is small enough to touch every pixel.
    this.quantized = f.posterizeLevels < 64 && vw * vh <= QUANTIZE_PIXEL_BUDGET;
    if (this.quantized) {
      const img = cc.getImageData(0, 0, vw, vh);
      quantizeDither(img.data, vw, vh, f.posterizeLevels, f.dither);
      cc.putImageData(img, 0, 0);
    }

    // 3. Upscale to the display with grading.
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = f.smooth >= 0.5;
    ctx.imageSmoothingQuality = 'high';
    if (this.filterSupported) ctx.filter = `saturate(${f.saturation.toFixed(3)}) contrast(${f.contrast.toFixed(3)})`;
    ctx.drawImage(this.compose, 0, 0, vw, vh, 0, 0, W, H);
    if (this.filterSupported) ctx.filter = 'none';

    // 4. Bloom: blur a quarter-resolution copy and add it back.
    if (f.bloom > 0.01 && this.filterSupported) {
      const bw = this.bloomA.width, bh = this.bloomA.height;
      const a = this.bloomACtx, b = this.bloomBCtx;
      a.filter = 'none';
      a.imageSmoothingEnabled = true;
      a.drawImage(this.compose, 0, 0, vw, vh, 0, 0, bw, bh);
      b.filter = 'none';
      b.fillStyle = '#000';
      b.fillRect(0, 0, bw, bh);
      b.filter = `blur(${Math.max(2, bw / 160).toFixed(1)}px) brightness(1.25) contrast(1.4)`;
      b.drawImage(this.bloomA, 0, 0);
      b.filter = 'none';
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = f.bloom * 0.35;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.bloomB, 0, 0, bw, bh, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // 5. Scanlines follow virtual rows.
    if (f.scanlines > 0.02) {
      ctx.fillStyle = `rgba(0,0,0,${(0.45 * f.scanlines).toFixed(3)})`;
      const pitch = H / vh;
      const thickness = Math.max(1, pitch * 0.4);
      for (let r = 0; r < vh; r++) ctx.fillRect(0, r * pitch, W, thickness);
    }

    // 6. Aperture grille on device columns.
    if (f.mask > 0.02 && this.grille) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = f.mask * 0.45;
      ctx.fillStyle = this.grille;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // 7. Vignette.
    if (f.vignette > 0.01) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.55);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${f.vignette.toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // 8. Grain (frozen when the stage passes time 0 for reduced motion).
    if (f.grain > 0.01 && this.grain) {
      const ox = Math.floor(input.time * 37) % 128, oy = Math.floor(input.time * 53) % 128;
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = f.grain;
      ctx.translate(-ox, -oy);
      ctx.fillStyle = this.grain;
      ctx.fillRect(0, 0, W + 128, H + 128);
    }
    ctx.restore();
  }

  dispose(): void {
    this.layers = [];
  }
}

function makeGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 128;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  const img = tctx.createImageData(128, 128);
  let seed = 1234567;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = 96 + (seed >>> 24) / 4; // 96..160 around neutral grey
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  return ctx.createPattern(tile, 'repeat');
}

function makeGrillePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement('canvas');
  tile.width = 3;
  tile.height = 1;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  const img = tctx.createImageData(3, 1);
  img.data.set([255, 170, 170, 255, 170, 255, 170, 255, 170, 170, 255, 255]);
  tctx.putImageData(img, 0, 0);
  return ctx.createPattern(tile, 'repeat');
}
