import { wrapWords } from './RecordingPainter';
import { Frame, spritePixelSize } from './layout';
import type { BoxStyle, GradientStop, Layer, Painter, PixelSprite, SpriteOptions, TextStyle } from './types';

export interface PainterStyle {
  /** 0 = flat art pixels, 1 = bevelled, lit tiles. */
  bevel: number;
}

const FONTS: Record<NonNullable<TextStyle['font']>, string> = {
  mono: "ui-monospace, Menlo, Monaco, 'Courier New', monospace",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
};

/**
 * Painter backed by three 2D canvases (one per layer). Each frame it draws into
 * the top-left vw×vh region of every canvas using a logical→virtual transform,
 * so games draw in logical units while the physical resolution follows the
 * fidelity ramp.
 */
export class CanvasPainter implements Painter {
  width = 960;
  height = 540;
  time = 0;

  private readonly ctxs: CanvasRenderingContext2D[];
  private current: Layer = 1;
  private scale = 1;
  private style: PainterStyle = { bevel: 0 };
  private colorCache = new Map<string, [number, number, number, number]>();
  private parseCtx: CanvasRenderingContext2D | null = null;

  constructor(private readonly layers: HTMLCanvasElement[]) {
    if (layers.length !== 3) throw new Error('CanvasPainter needs exactly three layer canvases');
    this.ctxs = layers.map(c => {
      const ctx = c.getContext('2d', { alpha: true });
      if (!ctx) throw new Error('2D canvas context unavailable');
      return ctx;
    });
  }

  beginFrame(frame: Frame, time: number, style: PainterStyle): void {
    this.width = frame.logicalWidth;
    this.height = frame.logicalHeight;
    this.scale = frame.scale;
    this.time = time;
    this.style = style;
    this.current = 1;
    for (const [i, ctx] of this.ctxs.entries()) {
      const c = this.layers[i];
      if (c.width !== frame.deviceWidth || c.height !== frame.deviceHeight) {
        c.width = frame.deviceWidth;
        c.height = frame.deviceHeight;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, frame.vw, frame.vh);
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      ctx.globalAlpha = 1;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
    }
  }

  private get ctx(): CanvasRenderingContext2D {
    return this.ctxs[this.current];
  }

  layer(layer: Layer): void {
    this.current = layer;
  }

  clear(color: string, layer?: Layer): void {
    const ctx = this.ctxs[layer ?? this.current];
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.width + 1, this.height + 1);
  }

  rect(x: number, y: number, w: number, h: number, color: string, alpha?: number): void {
    const ctx = this.ctx;
    this.withAlpha(ctx, alpha, () => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    });
  }

  box(x: number, y: number, w: number, h: number, style: BoxStyle): void {
    const ctx = this.ctx;
    this.withAlpha(ctx, style.alpha, () => {
      ctx.beginPath();
      if (style.radius && style.radius > 0) ctx.roundRect(x, y, w, h, style.radius);
      else ctx.rect(x, y, w, h);
      if (style.fill) {
        ctx.fillStyle = style.fill;
        ctx.fill();
      }
      if (style.stroke) {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = style.lineWidth ?? 2;
        ctx.stroke();
      }
    });
  }

  circle(x: number, y: number, r: number, color: string, alpha?: number): void {
    this.ellipse(x, y, r, r, color, alpha);
  }

  ellipse(x: number, y: number, rx: number, ry: number, color: string, alpha?: number): void {
    const ctx = this.ctx;
    this.withAlpha(ctx, alpha, () => {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  polygon(points: ReadonlyArray<readonly [number, number]>, color: string, alpha?: number): void {
    if (points.length < 3) return;
    const ctx = this.ctx;
    this.withAlpha(ctx, alpha, () => {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, width = 2, alpha?: number): void {
    const ctx = this.ctx;
    this.withAlpha(ctx, alpha, () => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    });
  }

  gradient(x: number, y: number, w: number, h: number, stops: readonly GradientStop[], direction: 'down' | 'right' | 'radial' = 'down'): void {
    const ctx = this.ctx;
    const g =
      direction === 'radial'
        ? ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) / 2)
        : direction === 'right'
          ? ctx.createLinearGradient(x, y, x + w, y)
          : ctx.createLinearGradient(x, y, x, y + h);
    for (const [offset, color] of stops) g.addColorStop(Math.min(1, Math.max(0, offset)), color);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  glow(x: number, y: number, r: number, color: string, alpha = 1): void {
    if (r <= 0) return;
    const ctx = this.ctx;
    const [cr, cg, cb, ca] = this.parseColor(color);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${ca * alpha})`);
    g.addColorStop(0.5, `rgba(${cr},${cg},${cb},${ca * alpha * 0.35})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  sprite(sprite: PixelSprite, x: number, y: number, opts: SpriteOptions = {}): void {
    const ctx = this.ctx;
    const artScale = opts.scale ?? 4;
    const pv = spritePixelSize(this.scale, artScale);
    const bevel = this.style.bevel;
    const cols = Math.max(...sprite.rows.map(r => r.length));
    // Centre the snapped footprint on the intended one so the sprite does not
    // creep right/down as the ramp changes the virtual resolution.
    const dx = (cols * artScale * this.scale - cols * pv) / 2;
    const dy = (sprite.rows.length * artScale * this.scale - sprite.rows.length * pv) / 2;
    const vx = Math.round(x * this.scale + dx);
    const vy = Math.round(y * this.scale + dy);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    for (let r = 0; r < sprite.rows.length; r++) {
      const row = sprite.rows[r];
      let c = 0;
      while (c < row.length) {
        const ch = row[c];
        if (ch === '.' || ch === ' ' || !sprite.palette[ch]) {
          c++;
          continue;
        }
        // Run-length rows of the same colour into one rect when drawing flat pixels.
        let run = 1;
        if (bevel < 0.01) while (c + run < row.length && row[c + run] === ch) run++;
        const col = opts.flipX ? cols - c - run : c;
        const px = vx + col * pv;
        const py = vy + r * pv;
        const color = sprite.palette[ch];
        ctx.fillStyle = color;
        if (bevel < 0.01 || pv < 3) {
          ctx.fillRect(px, py, pv * run, pv);
        } else {
          // Bevelled tile: rounded square with a light top-left and dark bottom-right edge.
          const inset = Math.max(0, Math.min(1, pv * 0.08 * bevel));
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(px + inset, py + inset, pv - inset * 2, pv - inset * 2, pv * 0.22 * bevel);
          ctx.clip();
          ctx.fillRect(px, py, pv, pv);
          ctx.fillStyle = `rgba(255,255,255,${0.28 * bevel})`;
          ctx.fillRect(px + inset, py + inset, pv - inset * 2, Math.max(1, pv * 0.18));
          ctx.fillStyle = `rgba(0,0,0,${0.3 * bevel})`;
          ctx.fillRect(px + inset, py + pv - inset - Math.max(1, pv * 0.18), pv - inset * 2, Math.max(1, pv * 0.18));
          ctx.restore();
        }
        c += run;
      }
    }
    ctx.restore();
  }

  path(d: string, x: number, y: number, scale: number, style: BoxStyle): void {
    const ctx = this.ctx;
    this.withAlpha(ctx, style.alpha, () => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      const p = new Path2D(d);
      if (style.fill) {
        ctx.fillStyle = style.fill;
        ctx.fill(p);
      }
      if (style.stroke) {
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = (style.lineWidth ?? 2) / scale;
        ctx.stroke(p);
      }
      ctx.restore();
    });
  }

  private applyFont(ctx: CanvasRenderingContext2D, style: Pick<TextStyle, 'size' | 'font' | 'weight' | 'letterSpacing'>): void {
    ctx.font = `${style.weight ?? 'normal'} ${style.size}px ${FONTS[style.font ?? 'mono']}`;
    const withSpacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ('letterSpacing' in withSpacing) withSpacing.letterSpacing = `${style.letterSpacing ?? 0}px`;
  }

  text(text: string, x: number, y: number, style: TextStyle): number {
    const ctx = this.ctx;
    let width = 0;
    this.withAlpha(ctx, style.alpha, () => {
      this.applyFont(ctx, style);
      ctx.textAlign = style.align ?? 'left';
      ctx.textBaseline = style.baseline ?? 'top';
      ctx.fillStyle = style.color;
      if (style.shadow) {
        ctx.shadowColor = style.shadow;
        ctx.shadowBlur = style.size * 0.6 * this.scale;
      }
      if (style.maxWidth) ctx.fillText(text, x, y, style.maxWidth);
      else ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      width = ctx.measureText(text).width;
    });
    return width;
  }

  textBlock(text: string, x: number, y: number, style: TextStyle & { maxWidth: number; lineHeight?: number }): number {
    const lines = wrapWords(text, style.maxWidth, s => this.measureText(s, style));
    const lh = style.lineHeight ?? style.size * 1.4;
    const { maxWidth: _ignored, ...lineStyle } = style;
    lines.forEach((line, i) => this.text(line, x, y + i * lh, lineStyle));
    return lines.length * lh;
  }

  measureText(text: string, style: Pick<TextStyle, 'size' | 'font' | 'weight' | 'letterSpacing'>): number {
    const ctx = this.ctx;
    this.applyFont(ctx, style);
    return ctx.measureText(text).width;
  }

  push(): void {
    this.ctx.save();
  }

  pop(): void {
    this.ctx.restore();
  }

  alpha(alpha: number): void {
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  }

  clip(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }

  private withAlpha(ctx: CanvasRenderingContext2D, alpha: number | undefined, draw: () => void): void {
    if (alpha === undefined || alpha >= 1) {
      draw();
      return;
    }
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * Math.max(0, alpha);
    draw();
    ctx.globalAlpha = prev;
  }

  /** Resolves any CSS colour to rgba components via a 1×1 scratch canvas. */
  private parseColor(color: string): [number, number, number, number] {
    const cached = this.colorCache.get(color);
    if (cached) return cached;
    if (!this.parseCtx) {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      this.parseCtx = c.getContext('2d', { willReadFrequently: true });
    }
    let out: [number, number, number, number] = [255, 255, 255, 1];
    if (this.parseCtx) {
      this.parseCtx.clearRect(0, 0, 1, 1);
      this.parseCtx.fillStyle = color;
      this.parseCtx.fillRect(0, 0, 1, 1);
      const d = this.parseCtx.getImageData(0, 0, 1, 1).data;
      const a = d[3] / 255;
      // Un-premultiply so the glow keeps the colour's hue at low alpha.
      out = a > 0 ? [Math.round(d[0] / a), Math.round(d[1] / a), Math.round(d[2] / a), a] : [0, 0, 0, 0];
      out = [Math.min(255, out[0]), Math.min(255, out[1]), Math.min(255, out[2]), out[3]];
    }
    this.colorCache.set(color, out);
    return out;
  }
}
