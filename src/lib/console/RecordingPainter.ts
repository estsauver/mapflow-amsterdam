import type { BoxStyle, GradientStop, Layer, Painter, PixelSprite, SpriteOptions, TextStyle } from './types';

export interface TextRecord { text: string; x: number; y: number; layer: Layer; frame: number }
export interface SpriteRecord { sprite: PixelSprite; x: number; y: number; layer: Layer; frame: number; scale: number }

/**
 * A Painter that records what was asked of it. Used by the headless runner so
 * a game can be exercised in tests without a canvas.
 */
export class RecordingPainter implements Painter {
  readonly texts: TextRecord[] = [];
  readonly sprites: SpriteRecord[] = [];
  readonly counts: Record<string, number> = {};
  time = 0;
  private frame = 0;
  private current: Layer = 1;

  constructor(public readonly width: number, public readonly height: number) {}

  beginFrame(frame: number, time = frame / 60): void {
    this.frame = frame;
    this.time = time;
    this.current = 1;
    this.texts.length = 0;
    this.sprites.length = 0;
  }

  private tally(op: string): void {
    this.counts[op] = (this.counts[op] ?? 0) + 1;
  }

  layer(layer: Layer): void { this.current = layer; }
  clear(_color: string, _layer?: Layer): void { this.tally('clear'); }
  rect(): void { this.tally('rect'); }
  box(_x: number, _y: number, _w: number, _h: number, _style: BoxStyle): void { this.tally('box'); }
  circle(): void { this.tally('circle'); }
  ellipse(): void { this.tally('ellipse'); }
  polygon(): void { this.tally('polygon'); }
  line(): void { this.tally('line'); }
  gradient(_x: number, _y: number, _w: number, _h: number, _stops: readonly GradientStop[]): void { this.tally('gradient'); }
  glow(): void { this.tally('glow'); }
  sprite(sprite: PixelSprite, x: number, y: number, opts?: SpriteOptions): void {
    this.tally('sprite');
    this.sprites.push({ sprite, x, y, layer: this.current, frame: this.frame, scale: opts?.scale ?? 4 });
  }
  path(_d: string, _x: number, _y: number, _scale: number, _style: BoxStyle): void { this.tally('path'); }
  text(text: string, x: number, y: number, style: TextStyle): number {
    this.tally('text');
    this.texts.push({ text, x, y, layer: this.current, frame: this.frame });
    return this.measureText(text, style);
  }
  textBlock(text: string, x: number, y: number, style: TextStyle & { maxWidth: number; lineHeight?: number }): number {
    const lines = wrapWords(text, style.maxWidth, w => this.measureText(w, style));
    const lh = style.lineHeight ?? style.size * 1.4;
    lines.forEach((line, i) => this.text(line, x, y + i * lh, style));
    return lines.length * lh;
  }
  measureText(text: string, style: Pick<TextStyle, 'size' | 'font' | 'weight' | 'letterSpacing'>): number {
    const perChar = style.font === 'mono' || !style.font ? 0.6 : 0.52;
    return text.length * (style.size * perChar + (style.letterSpacing ?? 0));
  }
  push(): void { this.tally('push'); }
  pop(): void { this.tally('pop'); }
  alpha(): void { this.tally('alpha'); }
  clip(): void { this.tally('clip'); }
}

/** Greedy word wrap shared by every painter so layout matches in tests and on screen. */
export function wrapWords(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measure(candidate) > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}
