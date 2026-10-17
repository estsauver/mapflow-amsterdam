/**
 * The "console": a tiny 2D drawing contract that the project games are written
 * against. Games draw in a logical coordinate space (height is always
 * LOGICAL_HEIGHT, width follows the viewport's aspect ratio) and never touch the
 * DOM. The stage decides the physical resolution each frame, which is how the
 * same game can be rendered as a 216-line 8-bit console or at full device
 * resolution, and then post-processes the result on the GPU.
 */

/** A pixel-art sprite: one character per art pixel, '.' or ' ' is transparent. */
export interface PixelSprite {
  readonly rows: readonly string[];
  readonly palette: Readonly<Record<string, string>>;
}

/** 0 = background, 1 = midground, 2 = foreground. Used for parallax depth. */
export type Layer = 0 | 1 | 2;

export interface TextStyle {
  /** Font size in logical pixels. */
  size: number;
  color: string;
  font?: 'mono' | 'serif' | 'sans';
  weight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'alphabetic' | 'bottom';
  /** Clip or wrap width in logical pixels (textBlock wraps; text clips). */
  maxWidth?: number;
  /** CSS colour for a soft glow behind the text. */
  shadow?: string;
  alpha?: number;
  letterSpacing?: number;
}

export interface SpriteOptions {
  /** Logical pixels per art pixel. Default 4. */
  scale?: number;
  flipX?: boolean;
  alpha?: number;
}

export interface BoxStyle {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  radius?: number;
  alpha?: number;
}

export type GradientStop = readonly [offset: number, color: string];

export interface Painter {
  /** Logical size of the frame. Height is always LOGICAL_HEIGHT. */
  readonly width: number;
  readonly height: number;
  /** Seconds since the program started. */
  readonly time: number;

  /** Select the layer subsequent calls draw into. Defaults to 1 each frame. */
  layer(layer: Layer): void;
  /** Fill the current layer (or the given one) with a colour. */
  clear(color: string, layer?: Layer): void;

  rect(x: number, y: number, w: number, h: number, color: string, alpha?: number): void;
  box(x: number, y: number, w: number, h: number, style: BoxStyle): void;
  circle(x: number, y: number, r: number, color: string, alpha?: number): void;
  ellipse(x: number, y: number, rx: number, ry: number, color: string, alpha?: number): void;
  polygon(points: ReadonlyArray<readonly [number, number]>, color: string, alpha?: number): void;
  line(x1: number, y1: number, x2: number, y2: number, color: string, width?: number, alpha?: number): void;
  gradient(x: number, y: number, w: number, h: number, stops: readonly GradientStop[], direction?: 'down' | 'right' | 'radial'): void;
  /** Soft radial glow centred at (x, y) fading to transparent at radius r. */
  glow(x: number, y: number, r: number, color: string, alpha?: number): void;
  sprite(sprite: PixelSprite, x: number, y: number, opts?: SpriteOptions): void;
  /**
   * Fills/strokes an SVG path (the `d` attribute) with its origin at (x, y) and
   * `scale` logical pixels per path unit. For vector illustrations.
   */
  path(d: string, x: number, y: number, scale: number, style: BoxStyle): void;
  /** Draws one line of text. Returns its logical width. */
  text(text: string, x: number, y: number, style: TextStyle): number;
  /** Word-wraps text inside maxWidth. Returns the logical height used. */
  textBlock(text: string, x: number, y: number, style: TextStyle & { maxWidth: number; lineHeight?: number }): number;
  measureText(text: string, style: Pick<TextStyle, 'size' | 'font' | 'weight' | 'letterSpacing'>): number;

  /** Save/restore the alpha and clip state. */
  push(): void;
  pop(): void;
  alpha(alpha: number): void;
  clip(x: number, y: number, w: number, h: number): void;
}

export interface PointerState {
  /** Logical coordinates. */
  x: number;
  y: number;
  down: boolean;
  /** True for exactly the frame the button went down. */
  justPressed: boolean;
  justReleased: boolean;
  inside: boolean;
}

export interface Input {
  pointer: PointerState;
  keysJustPressed: ReadonlySet<string>;
  keysDown: ReadonlySet<string>;
}

export interface GameHost {
  openUrl(url: string): void;
}

export interface GameProgram {
  readonly id: string;
  update(dt: number, input: Input, time: number): void;
  draw(p: Painter): void;
  dispose?(): void;
}

export type GameFactory = (host: GameHost) => GameProgram;
