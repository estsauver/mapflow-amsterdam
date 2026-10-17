/**
 * Storybook — the children's book publisher, ported from
 * src/components/StorybookGame.tsx onto the console.
 *
 * A robot librarian (LIBR-4R1) takes three children's requests, "creates" each
 * book in a purple workshop scene and reveals it, then rests on a complete
 * scene once all three are on the shelf. Every string, timer and colour is the
 * original's: Tailwind classes are converted to hex, CSS animations to time,
 * and the DOM layout is reproduced in logical pixels against a 540-high frame.
 * The illustrations are the original SVGs drawn as paths and primitives so they
 * stay smooth at any resolution. It is the only light-themed game.
 */
import { wrapWords } from '@/lib/console/RecordingPainter';
import { seededRandom } from '@/lib/console/random';
import type { GameFactory, Input, Painter, TextStyle } from '@/lib/console/types';

type Scene = 'library' | 'request' | 'creating' | 'reveal' | 'complete';
type CoverType = 'dino' | 'princess' | 'bunny';

interface BookRequest {
  childName: string;
  request: string;
  bookTitle: string;
  coverType: CoverType;
  hairColor: string;
  storyPreview: string;
}

const BOOK_REQUESTS: readonly BookRequest[] = [
  {
    childName: 'Emma',
    request: 'I want a book about a dinosaur construction worker!',
    bookTitle: 'Dino Builds a House',
    coverType: 'dino',
    hairColor: '#8B4513',
    storyPreview: 'Terry the T-Rex loved building things...',
  },
  {
    childName: 'Marcus',
    request: 'Can I have a story about a princess who flies rockets?',
    bookTitle: 'Princess Starlight',
    coverType: 'princess',
    hairColor: '#2D1B0E',
    storyPreview: 'Princess Nova dreamed of the stars...',
  },
  {
    childName: 'Sofia',
    request: 'I want a book about a bunny who bakes cookies!',
    bookTitle: 'Benny\'s Bakery',
    coverType: 'bunny',
    hairColor: '#1a1a1a',
    storyPreview: 'In a cozy burrow, Benny mixed the dough...',
  },
];

const TITLE = 'The Story Machine';
const TAGLINE = '"Tell me what book you\'d like, and I\'ll create it!"';
const ROBOT_LABEL = 'LIBR-4R1';
const PHASE_TEXT = ['', 'Preparing blank pages...', 'Writing story...', 'Creating illustrations...', 'Binding book...'] as const;
const CLOSING_LINE = 'Every child\'s imagination deserves a story.';
const PROJECT_LINE = 'PROJECT UNNAMED';
const SOON_LINE = 'More stories coming soon...';
const NEXT_LINE = 'Next request incoming...';

// --- Timers from the original component (seconds) ---------------------------
const LIBRARY_SECONDS = 2.5;
/** The typewriter interval; tick k shows request.slice(0, k - 1). */
const TYPE_INTERVAL = 0.05;
/** Pause after the tick that follows the last character. */
const REQUEST_HOLD = 1.5;
const PHASE_INTERVAL = 0.8;
const SPARKLE_INTERVAL = 0.2;
/** The fifth phase tick clears the sparkles ... */
const SPARKLES_END = 4 * PHASE_INTERVAL + PHASE_INTERVAL;
/** ... and schedules the reveal 500 ms later. */
const CREATING_SECONDS = SPARKLES_END + 0.5;
const REVEAL_SECONDS = 3;
const COMPLETE_SECONDS = 2.5;
/** Tailwind `transition-all` default and `duration-500`. */
const TRANSITION = 0.15;
const BOOK_TRANSITION = 0.5;
/** `prev.slice(-10)` plus the new sparkle. */
const MAX_SPARKLES = 11;
const SHELF_SLOTS = 8;
const SHELF_HEIGHT = 128;
/** `animate-bounce` lifts the revealed book by 25 % of its 288 px height. */
const BOUNCE = 72;

/** How long the request scene lasts: (length + 2) ticks, then the hold. */
const requestSeconds = (r: BookRequest) => (r.request.length + 2) * TYPE_INTERVAL + REQUEST_HOLD;

// --- Palette (Tailwind v3 defaults) ----------------------------------------
const C = {
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber800: '#92400e',
  amber900: '#78350f',
  purple900: '#581c87',
  indigo950: '#1e1b4b',
  purple400: '#c084fc',
  purple500: '#a855f7',
  purple600: '#9333ea',
  rose500: '#f43f5e',
  cyan100: '#cffafe',
  cyan400: '#22d3ee',
  cyan800: '#155e75',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  red500: '#ef4444',
  white: '#ffffff',
  black: '#000000',
} as const;
const SHELF_BOOK_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];

/**
 * Tailwind text sizes as [font size, line height]. text-sm and text-xs are
 * raised from 14/12 to 16/14 so they survive the 216-line 8-bit stage; the
 * other steps are the originals.
 */
const T = {
  xs: [14, 20],
  sm: [16, 24],
  base: [16, 24],
  lg: [18, 28],
  xl2: [24, 32],
} as const;
type TextSize = readonly [size: number, lineHeight: number];
type Face = NonNullable<TextStyle['font']>;
/** A text size scaled with its column (see drawComplete). */
const sz = ([size, lh]: TextSize, k: number): TextSize => [size * k, lh * k];

// --- Small maths ------------------------------------------------------------
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Moves v toward target by at most step. */
const approach = (v: number, target: number, step: number) => v + clamp(target - v, -step, step);
/** `animate-pulse`: opacity 1 → 0.5 → 1 over 2 s. */
const pulse = (t: number) => 0.75 + 0.25 * Math.cos(Math.PI * t);
/**
 * `animate-ping`: progress 0 → 1 of the expanding, fading copy over the first
 * 75 % of each second (ease-out), then 1 (gone) until the second ends.
 */
function pingK(age: number): number {
  const phase = age - Math.floor(age);
  if (phase >= 0.75) return 1;
  const k = phase / 0.75;
  return 1 - (1 - k) * (1 - k);
}
/**
 * `animate-bounce`: the element rests at 0 half-way through each second and
 * hops up to -amp at the start and end (ease-in falling, ease-out rising).
 */
function bounceOffset(t: number, amp: number): number {
  const phase = t - Math.floor(t);
  if (phase < 0.5) {
    const k = phase / 0.5;
    return -amp * (1 - k * k * k);
  }
  const k = (phase - 0.5) / 0.5;
  return -amp * (1 - (1 - k) * (1 - k) * (1 - k));
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerpColor(a: string, b: string, k: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const ch = (u: number, v: number) => Math.round(lerp(u, v, clamp(k, 0, 1))).toString(16).padStart(2, '0');
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
}

// --- Drawing helpers --------------------------------------------------------

/** One line of text positioned like a DOM line box: the glyphs centred in lineHeight. */
function line(p: Painter, text: string, x: number, lineTop: number, [size, lh]: TextSize, color: string, font: Face, extra: Partial<TextStyle> = {}): number {
  return p.text(text, x, lineTop + (lh - size) / 2, { size, color, font, ...extra });
}

const measure = (p: Painter, text: string, [size]: TextSize, font: Face, weight?: TextStyle['weight']) =>
  p.measureText(text, { size, font, weight });

/** A white (or tinted) panel with the stand-in for Tailwind's shadow-lg beneath it. */
function panel(p: Painter, x: number, y: number, w: number, h: number, radius: number, fill: string, alpha = 1): void {
  p.box(x, y + 6, w, h, { fill: C.black, alpha: 0.1, radius });
  p.box(x, y, w, h, { fill, radius, alpha });
}

/**
 * A gradient-filled box with rounded corners. gradient() fills a plain rectangle
 * and box() has no gradient, so the corner rows are drawn as 1 px strips inset
 * along the corner arc and the straight middle is one gradient fill (two
 * blended fills for the 135° diagonal, which the Painter cannot express directly:
 * ½·right + ½·down of the same stops is exactly the corner-to-corner ramp).
 */
function roundedGradient(
  p: Painter,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  from: string,
  to: string,
  dir: 'down' | 'diagonal',
  corners: 'all' | 'top',
  alpha = 1,
): void {
  const at = (v: number) => lerpColor(from, to, v);
  const r = Math.min(radius, h / 2, w / 2);
  const rows = Math.ceil(r);
  const inset = (row: number) => {
    const dy = r - (row + 0.5);
    return r - Math.sqrt(Math.max(0, r * r - dy * dy));
  };
  const strip = (row: number, ins: number) => {
    const v = (row + 0.5) / h;
    if (dir === 'down') p.rect(x + ins, y + row, w - 2 * ins, 1.02, at(v));
    else p.gradient(x + ins, y + row, w - 2 * ins, 1.02, [[0, at(v / 2)], [1, at((1 + v) / 2)]], 'right');
  };
  p.push();
  p.alpha(alpha);
  for (let i = 0; i < rows; i++) strip(i, inset(i));
  if (corners === 'all') for (let i = 0; i < rows; i++) strip(h - 1 - i, inset(i));
  const my = y + rows;
  const mh = h - rows - (corners === 'all' ? rows : 0);
  const v0 = rows / h;
  const v1 = (rows + mh) / h;
  if (dir === 'down') {
    p.gradient(x, my, w, mh, [[0, at(v0)], [1, at(v1)]], 'down');
  } else {
    p.gradient(x, my, w, mh, [[0, from], [1, to]], 'right');
    p.alpha(alpha * 0.5);
    p.gradient(x, my, w, mh, [[0, at(v0)], [1, at(v1)]], 'down');
  }
  p.pop();
}

/**
 * Top of a vertically centred content column in the scenes that have the
 * bookshelf. The DOM centred the column in its whole (much taller) container,
 * where it cleared the 128 px shelf; in a 540-high frame that puts text on the
 * shelf, so the column is centred in the space above it instead and never
 * starts closer than `margin` to the top.
 */
const columnTop = (p: Painter, colH: number, margin = 8) => Math.max(margin, (p.height - SHELF_HEIGHT - colH) / 2);

/** Full-frame amber-100 → amber-200 background on layer 0. */
function drawAmber(p: Painter): void {
  p.layer(0);
  p.gradient(0, 0, p.width, p.height, [[0, C.amber100], [1, C.amber200]], 'down');
}

// --- The SVG illustrations, as paths and primitives -------------------------

const SPARKLE_PATH = 'M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z';
/** The 24-unit sparkle centred at (cx, cy) and `size` logical px across. */
function drawSparkle(p: Painter, cx: number, cy: number, size: number, alpha: number): void {
  p.path(SPARKLE_PATH, cx - size / 2, cy - size / 2, size / 24, { fill: '#FCD34D', alpha });
}

/** An SVG ellipse as a path, for the one ellipse that needs a stroke. */
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** ChildAvatar (viewBox 80): origin (x, y), `s` logical px per unit. */
function drawChild(p: Painter, x: number, y: number, s: number, hair: string): void {
  const X = (v: number) => x + v * s;
  const Y = (v: number) => y + v * s;
  p.circle(X(40), Y(42), 28 * s, '#FDBF6F');
  p.ellipse(X(40), Y(28), 26 * s, 18 * s, hair);
  p.ellipse(X(20), Y(35), 8 * s, 12 * s, hair);
  p.ellipse(X(60), Y(35), 8 * s, 12 * s, hair);
  p.circle(X(32), Y(42), 4 * s, '#2D1B0E');
  p.circle(X(48), Y(42), 4 * s, '#2D1B0E');
  p.circle(X(33), Y(41), 1.5 * s, C.white);
  p.circle(X(49), Y(41), 1.5 * s, C.white);
  p.path('M 32 54 Q 40 62 48 54', x, y, s, { stroke: '#2D1B0E', lineWidth: 2 * s });
  p.circle(X(24), Y(50), 4 * s, '#FFB6C1', 0.5);
  p.circle(X(56), Y(50), 4 * s, '#FFB6C1', 0.5);
}

/** DinoBookCover (viewBox 100). */
function drawDino(p: Painter, x: number, y: number, s: number): void {
  const X = (v: number) => x + v * s;
  const Y = (v: number) => y + v * s;
  p.ellipse(X(50), Y(60), 25 * s, 20 * s, '#4ADE80');
  p.circle(X(70), Y(45), 15 * s, '#4ADE80');
  p.circle(X(74), Y(42), 4 * s, C.white);
  p.circle(X(75), Y(42), 2 * s, '#2D1B0E');
  p.path('M 68 52 Q 74 56 80 52', x, y, s, { stroke: '#2D1B0E', lineWidth: 2 * s });
  p.ellipse(X(70), Y(32), 14 * s, 8 * s, '#FCD34D');
  p.rect(X(56), Y(30), 28 * s, 6 * s, '#FCD34D');
  p.path('M 25 60 Q 10 50 15 70', x, y, s, { stroke: '#4ADE80', lineWidth: 12 * s });
  p.box(X(35), Y(75), 8 * s, 15 * s, { fill: '#4ADE80', radius: 3 * s });
  p.box(X(55), Y(75), 8 * s, 15 * s, { fill: '#4ADE80', radius: 3 * s });
  p.box(X(40), Y(50), 6 * s, 12 * s, { fill: '#4ADE80', radius: 2 * s });
  p.rect(X(38), Y(45), 3 * s, 15 * s, '#8B4513');
  p.box(X(34), Y(42), 10 * s, 6 * s, { fill: '#6B7280', radius: 1 * s });
}

/** PrincessBookCover (viewBox 100). */
function drawPrincess(p: Painter, x: number, y: number, s: number): void {
  const X = (v: number) => x + v * s;
  const Y = (v: number) => y + v * s;
  p.ellipse(X(70), Y(50), 12 * s, 25 * s, '#E5E7EB');
  p.ellipse(X(70), Y(30), 8 * s, 10 * s, '#EF4444');
  p.circle(X(70), Y(45), 6 * s, '#60A5FA');
  p.path('M 62 75 Q 70 90 78 75', x, y, s, { fill: '#F97316' });
  p.path('M 65 75 Q 70 85 75 75', x, y, s, { fill: '#FCD34D' });
  p.circle(X(35), Y(45), 12 * s, '#FDBF6F');
  p.path('M 25 35 L 28 28 L 32 35 L 35 25 L 38 35 L 42 28 L 45 35', x, y, s, { fill: '#FCD34D', stroke: '#F59E0B', lineWidth: 1 * s });
  p.path('M 23 45 Q 20 60 30 65', x, y, s, { stroke: '#8B4513', lineWidth: 4 * s });
  p.path('M 47 45 Q 50 60 40 65', x, y, s, { stroke: '#8B4513', lineWidth: 4 * s });
  p.circle(X(31), Y(44), 2 * s, '#2D1B0E');
  p.circle(X(39), Y(44), 2 * s, '#2D1B0E');
  p.path('M 32 50 Q 35 54 38 50', x, y, s, { stroke: '#2D1B0E', lineWidth: 1.5 * s });
  p.polygon([[X(25), Y(55)], [X(35), Y(80)], [X(45), Y(55)]], '#EC4899');
  p.circle(X(15), Y(20), 2 * s, '#FCD34D');
  p.circle(X(85), Y(15), 1.5 * s, '#FCD34D');
  p.circle(X(20), Y(80), 1.5 * s, '#FCD34D');
}

/** BunnyBookCover (viewBox 100). */
function drawBunny(p: Painter, x: number, y: number, s: number): void {
  const X = (v: number) => x + v * s;
  const Y = (v: number) => y + v * s;
  p.ellipse(X(40), Y(60), 20 * s, 22 * s, '#F5F5F4');
  p.circle(X(40), Y(35), 18 * s, '#F5F5F4');
  p.ellipse(X(28), Y(12), 6 * s, 18 * s, '#F5F5F4');
  p.ellipse(X(28), Y(12), 3 * s, 12 * s, '#FECACA');
  p.ellipse(X(52), Y(12), 6 * s, 18 * s, '#F5F5F4');
  p.ellipse(X(52), Y(12), 3 * s, 12 * s, '#FECACA');
  p.circle(X(34), Y(32), 3 * s, '#2D1B0E');
  p.circle(X(46), Y(32), 3 * s, '#2D1B0E');
  p.circle(X(35), Y(31), 1 * s, C.white);
  p.circle(X(47), Y(31), 1 * s, C.white);
  p.ellipse(X(40), Y(40), 3 * s, 2 * s, '#FECACA');
  p.line(X(25), Y(38), X(32), Y(40), '#D1D5DB', 1 * s);
  p.line(X(25), Y(42), X(32), Y(42), '#D1D5DB', 1 * s);
  p.line(X(48), Y(40), X(55), Y(38), '#D1D5DB', 1 * s);
  p.line(X(48), Y(42), X(55), Y(42), '#D1D5DB', 1 * s);
  p.path(ellipsePath(40, 18, 14, 6), x, y, s, { fill: C.white, stroke: '#E5E7EB', lineWidth: 1 * s });
  p.ellipse(X(40), Y(12), 10 * s, 8 * s, C.white);
  p.circle(X(75), Y(60), 15 * s, '#D97706');
  p.circle(X(70), Y(55), 2 * s, '#78350F');
  p.circle(X(78), Y(58), 2 * s, '#78350F');
  p.circle(X(74), Y(65), 2 * s, '#78350F');
  p.circle(X(80), Y(65), 1.5 * s, '#78350F');
  p.ellipse(X(55), Y(70), 6 * s, 4 * s, '#F5F5F4');
}

/** A book cover clipped to its 100-unit viewBox like the inline svg was. */
function drawCover(p: Painter, type: CoverType, x: number, y: number, s: number): void {
  p.push();
  p.clip(x, y, 100 * s, 100 * s);
  if (type === 'dino') drawDino(p, x, y, s);
  else if (type === 'princess') drawPrincess(p, x, y, s);
  else drawBunny(p, x, y, s);
  p.pop();
}

/** BookStackIcon (viewBox 80). */
function drawBookStack(p: Painter, x: number, y: number, s: number): void {
  const X = (v: number) => x + v * s;
  const Y = (v: number) => y + v * s;
  p.box(X(10), Y(50), 60 * s, 12 * s, { fill: '#3B82F6', radius: 2 * s });
  p.rect(X(10), Y(50), 4 * s, 12 * s, '#2563EB');
  p.box(X(15), Y(36), 55 * s, 12 * s, { fill: '#EF4444', radius: 2 * s });
  p.rect(X(15), Y(36), 4 * s, 12 * s, '#DC2626');
  p.box(X(12), Y(22), 58 * s, 12 * s, { fill: '#22C55E', radius: 2 * s });
  p.rect(X(12), Y(22), 4 * s, 12 * s, '#16A34A');
  p.line(X(25), Y(28), X(55), Y(28), C.white, 1 * s, 0.5);
  p.line(X(30), Y(42), X(55), Y(42), C.white, 1 * s, 0.5);
  p.line(X(25), Y(56), X(50), Y(56), C.white, 1 * s, 0.5);
}

// --- The robot, the bookshelf and the library -------------------------------

/**
 * The robot's layout box is its body alone: in the DOM the antenna, arms and
 * label are absolutely positioned, so a following `mt-8` is measured from the
 * body's bottom edge (the label's 8 px overhang eats into that gap). Columns
 * reserve ANTENNA above the body so the tip never leaves the frame.
 */
const ROBOT_BODY = 160;
const ANTENNA = 24;

/**
 * renderRobot(): a 128×160 slate body with a rounded top, two glowing cyan
 * eyes, a speaker mouth, an antenna, two arms and the LIBR-4R1 label. `top` is
 * the body's top edge; the antenna rises 24 px above it. While speaking the eyes
 * and mouth pulse and the antenna ball pings, otherwise the ball pulses. `k`
 * scales the whole robot about its top-centre (1 = the DOM's size).
 */
function drawRobot(p: Painter, cx: number, top: number, speaking: boolean, mouthOpen: number, t: number, k = 1): void {
  const x = cx - 64 * k;
  roundedGradient(p, x, top, 128 * k, ROBOT_BODY * k, 24 * k, C.slate400, C.slate500, 'down', 'top');
  // Eyes: top-6, gap-4, w-8 h-8, with a 20 px cyan box-shadow and a white highlight at mt-1 ml-1.
  const eyeA = speaking ? pulse(t) : 1;
  for (const ex of [cx - 24 * k, cx + 24 * k]) {
    p.glow(ex, top + 40 * k, 36 * k, C.cyan400, 0.8 * eyeA);
    p.circle(ex, top + 40 * k, 16 * k, C.cyan400, eyeA);
    p.circle(ex - 6 * k, top + 34 * k, 6 * k, C.white, eyeA);
  }
  // Mouth/speaker: bottom-8, w-12 h-4, three w-2 bars that grow from h-1 to h-3 while speaking.
  const mouthA = speaking ? pulse(t) : 1;
  p.box(cx - 24 * k, top + 112 * k, 48 * k, 16 * k, { fill: C.slate700, radius: 8 * k, alpha: mouthA });
  const barH = lerp(4, 12, mouthOpen) * k;
  for (let i = 0; i < 3; i++) {
    p.box(cx + (-16 + i * 12) * k, top + 120 * k - barH / 2, 8 * k, barH, { fill: C.cyan400, radius: 4 * k, alpha: mouthA });
  }
  // Antenna: in the DOM the 4×24 stem sits at -top-6 and the 16 px ball flows beneath it, straddling the body's top edge.
  p.rect(cx - 2 * k, top - ANTENNA * k, 4 * k, ANTENNA * k, C.slate600);
  if (speaking) {
    p.circle(cx, top + 8 * k, 8 * k, C.red500);
    const ping = pingK(t);
    if (ping < 1) {
      const r = 8 * k * (1 + ping);
      p.box(cx - r, top + 8 * k - r, 2 * r, 2 * r, { stroke: C.red500, lineWidth: 2 * k, radius: r, alpha: 1 - ping });
    }
  } else {
    p.circle(cx, top + 8 * k, 8 * k, C.red500, pulse(t));
  }
  // Arms: top-24, hanging 32 px outside the body, w-8 h-20 rounded-full.
  p.box(x - 32 * k, top + 96 * k, 32 * k, 80 * k, { fill: C.slate400, radius: 16 * k });
  p.box(x + 128 * k, top + 96 * k, 32 * k, 80 * k, { fill: C.slate400, radius: 16 * k });
  // Label: amber-600 px-3 py-1 rounded, overhanging the body bottom by 8 px.
  const labelSize = sz(T.xs, k);
  const lw = measure(p, ROBOT_LABEL, labelSize, 'mono') + 24 * k;
  const ly = top + (ROBOT_BODY + 8 - 24) * k;
  p.box(cx - lw / 2, ly, lw, 24 * k, { fill: C.amber600, radius: 4 * k });
  line(p, ROBOT_LABEL, cx, ly + 2 * k, labelSize, C.white, 'mono', { align: 'center' });
}

/** renderBookshelf(): the 128 px amber shelf along the bottom with the created books in 8 slots. */
function drawBookshelf(p: Painter, books: number): void {
  const y = p.height - SHELF_HEIGHT;
  p.rect(0, y, p.width, SHELF_HEIGHT, C.amber900);
  p.rect(0, y, p.width, 16, C.amber800);
  const slot = (p.width - 32) / SHELF_SLOTS;
  for (let i = 0; i < Math.min(books, SHELF_SLOTS); i++) {
    const cx = 16 + (i + 0.5) * slot;
    const cy = y + 32 + 40;
    const a = ((((i * 2) % 6) - 3) * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const pt = (dx: number, dy: number): [number, number] => [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
    p.polygon([pt(-16, -40), pt(16, -40), pt(16, 40), pt(-16, 40)], SHELF_BOOK_COLORS[i % SHELF_BOOK_COLORS.length]);
  }
}

/** The faint rows of book spines behind the library scene (inset-0 opacity-20, three rows of eight). */
function drawLibraryShelves(p: Painter): void {
  for (let row = 0; row < 3; row++) {
    const y = 32 + row * 96;
    for (let col = 0; col < 8; col++) {
      const alpha = 0.2 * (0.3 + ((col + row) % 3) * 0.2);
      p.rect((col + 0.5) * (p.width / 8) - 12, y, 24, 64, C.amber800, alpha);
    }
  }
}

// --- State ------------------------------------------------------------------

interface Sparkle {
  /** Position as fractions of the frame (left/top percentages in the DOM). */
  x: number;
  y: number;
  /** Scene time it appeared; its ping animation starts then. */
  born: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface State {
  scene: Scene;
  /** Seconds into the current scene, carried across transitions so the cadence never drifts. */
  sceneT: number;
  /** Seconds since the program started. */
  t: number;
  idx: number;
  typedLen: number;
  phase: number;
  booksCreated: number;
  sparkles: Sparkle[];
  sparklesSpawned: number;
  /** 0 = mouth bars at h-1, 1 = at h-3 (transition-all). */
  mouthOpen: number;
  /** The creating book's transitions (duration-500). */
  bookOpacity: number;
  squeeze: number;
  glowMix: number;
  /** 0..1 hover:scale-105 on the revealed book. */
  hover: number;
  /** The revealed book's layout box from the last draw, for the hover hit-test. */
  bookRect: Rect | null;
}

// --- Scenes -----------------------------------------------------------------

function drawLibrary(p: Painter, s: State): void {
  const cx = p.width / 2;
  drawAmber(p);
  drawLibraryShelves(p);
  drawBookshelf(p, s.booksCreated);
  const titleW = measure(p, TITLE, T.xl2, 'serif');
  const rowW = 24 + 8 + titleW + 8 + 24;
  const tagW = measure(p, TAGLINE, T.sm, 'sans');
  const bubbleW = Math.max(rowW, tagW) + 64;
  const bubbleH = 16 + T.xl2[1] + 8 + T.sm[1] + 16;
  const blockH = ANTENNA + ROBOT_BODY + 32 + bubbleH;
  const bodyTop = columnTop(p, blockH) + ANTENNA;
  p.layer(1);
  drawRobot(p, cx, bodyTop, true, s.mouthOpen, s.t);
  p.layer(2);
  const by = bodyTop + ROBOT_BODY + 32;
  panel(p, cx - bubbleW / 2, by, bubbleW, bubbleH, 12, C.white, 0.9);
  const rowLeft = cx - rowW / 2;
  drawSparkle(p, rowLeft + 12, by + 16 + 16, 24, 1);
  line(p, TITLE, rowLeft + 32, by + 16, T.xl2, C.amber800, 'serif');
  drawSparkle(p, rowLeft + rowW - 12, by + 16 + 16, 24, 1);
  line(p, TAGLINE, cx, by + 16 + T.xl2[1] + 8, T.sm, C.amber600, 'sans', { align: 'center' });
}

function drawRequest(p: Painter, s: State): void {
  const req = BOOK_REQUESTS[s.idx];
  const cx = p.width / 2;
  drawAmber(p);
  drawBookshelf(p, s.booksCreated);
  // The bubble grows with the typed text up to max-w-md (448), then wraps inside px-6.
  const typed = req.request.slice(0, s.typedLen);
  const withCursor = `"${typed}"|`;
  const bubbleW = Math.min(measure(p, withCursor, T.lg, 'serif') + 48, 448);
  const lines = wrapWords(withCursor, bubbleW - 48, w => measure(p, w, T.lg, 'serif'));
  const last = lines.length - 1;
  lines[last] = lines[last].slice(0, -1); // the cursor is drawn separately so it can pulse
  const bubbleH = lines.length * T.lg[1] + 32;
  const avatarH = 80 + T.base[1];
  const rowH = Math.max(avatarH, bubbleH);
  // The antenna rises into the mt-12 gap under the row, as it does in the DOM.
  const colH = rowH + 48 + ROBOT_BODY;
  const colTop = columnTop(p, colH);
  const rowBottom = colTop + rowH;
  const rowW = 80 + 32 + bubbleW;
  const rowLeft = cx - rowW / 2;
  p.layer(1);
  drawChild(p, rowLeft, rowBottom - avatarH, 1, req.hairColor);
  line(p, req.childName, rowLeft + 40, rowBottom - T.base[1], T.base, C.amber800, 'serif', { align: 'center' });
  drawRobot(p, cx, rowBottom + 48, s.typedLen > 0, s.mouthOpen, s.t);
  p.layer(2);
  const bx = rowLeft + 112;
  const by = rowBottom - bubbleH;
  panel(p, bx, by, bubbleW, bubbleH, 16, C.white);
  p.polygon([[bx + 4, by + bubbleH - 36], [bx + 4, by + bubbleH - 16], [bx - 16, by + bubbleH - 26]], C.white);
  lines.forEach((ln, i) => line(p, ln, bx + 24, by + 16 + i * T.lg[1], T.lg, C.amber900, 'serif'));
  const cursorX = bx + 24 + measure(p, lines[last], T.lg, 'serif');
  line(p, '|', cursorX, by + 16 + last * T.lg[1], T.lg, C.amber900, 'serif', { alpha: pulse(s.t) });
}

function drawCreating(p: Painter, s: State): void {
  const req = BOOK_REQUESTS[s.idx];
  const cx = p.width / 2;
  p.layer(0);
  p.gradient(0, 0, p.width, p.height, [[0, C.purple900], [1, C.indigo950]], 'down');
  p.layer(1);
  for (const sp of s.sparkles) {
    const k = pingK(s.sceneT - sp.born);
    if (k >= 1) continue;
    drawSparkle(p, sp.x * p.width + 16, sp.y * p.height + 16, 32 * (1 + k), 1 - k);
  }
  const colH = ANTENNA + ROBOT_BODY + 32 + 256 + 32 + T.base[1];
  const bodyTop = (p.height - colH) / 2 + ANTENNA;
  drawRobot(p, cx, bodyTop, true, s.mouthOpen, s.t);
  // The 192×256 book: fades in (phase 1), turns 10° about Y — an orthographic
  // horizontal squeeze without perspective (phase 2), glows purple (phase 3),
  // then gets its gradient cover (phase 4).
  const by = bodyTop + ROBOT_BODY + 32;
  const bw = 192 * lerp(1, Math.cos((10 * Math.PI) / 180), s.squeeze);
  const bx = cx - bw / 2;
  if (s.bookOpacity > 0) {
    const a = s.bookOpacity;
    p.glow(cx, by + 128, 128 + 20, C.white, 0.3 * (1 - s.glowMix) * a);
    p.glow(cx, by + 128, 128 + 60, C.purple500, 0.8 * s.glowMix * a);
    p.box(bx, by, bw, 256, { fill: C.white, radius: 8, alpha: a });
    if (s.phase >= 3 && s.phase < 4) {
      const inner = bw - 32;
      const pa = pulse(s.t) * a;
      p.box(bx + 16, by + 16, inner * 0.75, 8, { fill: C.slate300, radius: 4, alpha: pa });
      p.box(bx + 16, by + 32, inner, 8, { fill: C.slate300, radius: 4, alpha: pa });
      p.box(bx + 16, by + 48, inner * (5 / 6), 8, { fill: C.slate300, radius: 4, alpha: pa });
    }
    if (s.phase >= 4) {
      roundedGradient(p, bx, by, bw, 256, 8, C.rose500, C.purple600, 'diagonal', 'all', a);
      drawCover(p, req.coverType, cx - 48, by + 128 - 48, 0.96);
    }
  }
  p.layer(2);
  const status = PHASE_TEXT[s.phase];
  if (status) line(p, status, cx, by + 256 + 32, T.base, C.white, 'mono', { align: 'center' });
}

function drawReveal(p: Painter, s: State): void {
  const req = BOOK_REQUESTS[s.idx];
  const cx = p.width / 2;
  drawAmber(p);
  drawBookshelf(p, s.booksCreated);
  const preview = `"${req.storyPreview}"`;
  const previewW = Math.min(measure(p, preview, T.base, 'serif') + 48, 448);
  const previewLines = wrapWords(preview, previewW - 48, w => measure(p, w, T.base, 'serif'));
  const previewH = previewLines.length * T.base[1] + 32;
  const colH = 288 + 32 + previewH + 16 + 40;
  // The column leaves headroom for the bounce so the book never leaves the frame.
  const colTop = columnTop(p, colH, 8 + BOUNCE);
  const amp = Math.min(BOUNCE, colTop - 8);
  const hop = bounceOffset(s.sceneT, amp);
  const sc = lerp(1, 1.05, s.hover);
  const bcy = colTop + 144 + hop;
  const bw = 224 * sc;
  const bh = 288 * sc;
  const bx = cx - bw / 2;
  const by = bcy - bh / 2;
  s.bookRect = { x: cx - 112, y: colTop + hop, w: 224, h: 288 };
  p.layer(1);
  p.glow(cx, bcy, bh / 2 + 40, C.purple500, 0.5);
  roundedGradient(p, bx, by, bw, bh, 8 * sc, C.rose500, C.purple500, 'diagonal', 'all');
  // Spine: a 16 px black/20 strip with only its left corners rounded.
  p.push();
  p.clip(bx, by, 16 * sc, bh);
  p.box(bx, by, 32 * sc, bh, { fill: C.black, alpha: 0.2, radius: 8 * sc });
  p.pop();
  // Cover (96 px) and title stacked and centred in the book.
  const innerTop = bcy - 66 * sc;
  drawCover(p, req.coverType, cx - 48 * sc, innerTop, 0.96 * sc);
  p.text(req.bookTitle, cx, innerTop + 104 * sc + 5 * sc, {
    size: T.lg[0] * sc,
    color: C.white,
    font: 'serif',
    weight: 'bold',
    align: 'center',
    maxWidth: 192 * sc,
  });
  p.layer(2);
  const py = colTop + 288 + 32;
  const px = cx - previewW / 2;
  panel(p, px, py, previewW, previewH, 12, C.white, 0.9);
  previewLines.forEach((ln, i) => line(p, ln, px + 24, py + 16 + i * T.base[1], T.base, C.amber800, 'serif'));
  // The robot's aside: a 40 px slate icon with a cyan dot, then a cyan-100 bubble.
  const ry = py + previewH + 16;
  const msg = `"Here you go, ${req.childName}!"`;
  const mw = measure(p, msg, T.sm, 'mono');
  const rowW = 40 + 16 + mw + 32;
  const rx = cx - rowW / 2;
  p.box(rx, ry, 40, 40, { fill: C.slate400, radius: 8 });
  p.circle(rx + 20, ry + 20, 6, C.cyan400);
  p.box(rx + 56, ry, mw + 32, 40, { fill: C.cyan100, radius: 12 });
  line(p, msg, rx + 72, ry + 8, T.sm, C.cyan800, 'mono');
}

function drawComplete(p: Painter, s: State): void {
  const cx = p.width / 2;
  const final = s.idx >= BOOK_REQUESTS.length - 1;
  drawAmber(p);
  drawBookshelf(p, s.booksCreated);
  const count = `Books Created: ${s.booksCreated}`;
  // Under the count line its mb-2 collapses into the next line's mt-4, so that gap is 16, not 24.
  const extrasH = final ? 16 + T.base[1] + 32 + T.sm[1] + 8 + T.xs[1] : 16 + T.sm[1];
  const colH = ANTENNA + ROBOT_BODY + 32 + 64 + 8 + T.xl2[1] + extrasH;
  // The DOM centred this column in a container tall enough to clear the shelf. The final
  // column is taller than the 412 px above it here, so the whole column — robot, icon,
  // text and gaps — scales down to fit between the top margin and the shelf; the other
  // complete scenes fit at k = 1.
  const k = Math.min(1, (p.height - SHELF_HEIGHT - 16) / colH);
  const bodyTop = columnTop(p, colH * k) + ANTENNA * k;
  const xl2 = sz(T.xl2, k);
  const base = sz(T.base, k);
  const sm = sz(T.sm, k);
  const xs = sz(T.xs, k);
  p.layer(1);
  drawRobot(p, cx, bodyTop, false, s.mouthOpen, s.t, k);
  const textTop = bodyTop + (ROBOT_BODY + 32) * k;
  // The stack icon is a block-level svg, so the DOM left-aligns it inside the centred text column.
  const widths = final
    ? [measure(p, count, xl2, 'serif'), measure(p, CLOSING_LINE, base, 'serif'), measure(p, PROJECT_LINE, sm, 'mono'), measure(p, SOON_LINE, xs, 'mono')]
    : [measure(p, count, xl2, 'serif'), measure(p, NEXT_LINE, sm, 'sans')];
  const colW = Math.max(64 * k, ...widths);
  drawBookStack(p, cx - colW / 2, textTop, 0.8 * k);
  p.layer(2);
  line(p, count, cx, textTop + (64 + 8) * k, xl2, C.amber800, 'serif', { align: 'center' });
  let y = textTop + (64 + 8) * k + xl2[1] + 16 * k;
  if (final) {
    line(p, CLOSING_LINE, cx, y, base, C.amber600, 'serif', { align: 'center' });
    y += base[1] + 32 * k;
    line(p, PROJECT_LINE, cx, y, sm, C.purple600, 'mono', { align: 'center' });
    y += sm[1] + 8 * k;
    line(p, SOON_LINE, cx, y, xs, C.purple400, 'mono', { align: 'center' });
  } else {
    line(p, NEXT_LINE, cx, y, sm, C.amber500, 'sans', { align: 'center', alpha: pulse(s.t) });
  }
}

// --- The program ------------------------------------------------------------

export const createStorybookGame: GameFactory = () => {
  const rng = seededRandom(0x5704b00c);
  const s: State = {
    scene: 'library',
    sceneT: 0,
    t: 0,
    idx: 0,
    typedLen: 0,
    phase: 0,
    booksCreated: 0,
    sparkles: [],
    sparklesSpawned: 0,
    mouthOpen: 0,
    bookOpacity: 0,
    squeeze: 0,
    glowMix: 0,
    hover: 0,
    bookRect: null,
  };

  /** Switches scene, carrying the overshoot so the original's timer chain stays exact. */
  const enter = (scene: Scene, carry: number) => {
    s.scene = scene;
    s.sceneT = Math.max(0, carry);
    if (scene === 'request') s.typedLen = 0;
    if (scene === 'creating') {
      s.phase = 0;
      s.sparkles = [];
      s.sparklesSpawned = 0;
      s.bookOpacity = 0;
      s.squeeze = 0;
      s.glowMix = 0;
    }
    if (scene === 'reveal') {
      s.hover = 0;
      s.bookRect = null;
    }
  };

  return {
    id: 'storybook',
    update(dt: number, input: Input) {
      s.t += dt;
      s.sceneT += dt;
      switch (s.scene) {
        case 'library':
          if (s.sceneT >= LIBRARY_SECONDS) enter('request', s.sceneT - LIBRARY_SECONDS);
          break;
        case 'request': {
          const req = BOOK_REQUESTS[s.idx];
          s.typedLen = clamp(Math.floor(s.sceneT / TYPE_INTERVAL + 1e-6) - 1, 0, req.request.length);
          const end = requestSeconds(req);
          if (s.sceneT >= end) enter('creating', s.sceneT - end);
          break;
        }
        case 'creating': {
          s.phase = Math.min(4, Math.floor(s.sceneT / PHASE_INTERVAL + 1e-6));
          if (s.sceneT < SPARKLES_END) {
            while ((s.sparklesSpawned + 1) * SPARKLE_INTERVAL <= s.sceneT + 1e-6) {
              s.sparklesSpawned++;
              const born = s.sparklesSpawned * SPARKLE_INTERVAL;
              s.sparkles = [...s.sparkles.slice(-(MAX_SPARKLES - 1)), { x: 0.4 + rng() * 0.2, y: 0.3 + rng() * 0.3, born }];
            }
          } else {
            s.sparkles = [];
          }
          s.bookOpacity = approach(s.bookOpacity, s.phase >= 1 ? 1 : 0, dt / BOOK_TRANSITION);
          s.squeeze = approach(s.squeeze, s.phase >= 2 ? 1 : 0, dt / BOOK_TRANSITION);
          s.glowMix = approach(s.glowMix, s.phase >= 3 ? 1 : 0, dt / BOOK_TRANSITION);
          if (s.sceneT >= CREATING_SECONDS) enter('reveal', s.sceneT - CREATING_SECONDS);
          break;
        }
        case 'reveal': {
          const r = s.bookRect;
          const pt = input.pointer;
          const over = r !== null && pt.inside && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
          s.hover = approach(s.hover, over ? 1 : 0, dt / TRANSITION);
          if (s.sceneT >= REVEAL_SECONDS) {
            s.booksCreated++;
            enter('complete', s.sceneT - REVEAL_SECONDS);
          }
          break;
        }
        case 'complete':
          if (s.sceneT >= COMPLETE_SECONDS && s.idx < BOOK_REQUESTS.length - 1) {
            s.idx++;
            enter('request', s.sceneT - COMPLETE_SECONDS);
          }
          break;
      }
      const speaking = s.scene === 'library' || s.scene === 'creating' || (s.scene === 'request' && s.typedLen > 0);
      s.mouthOpen = approach(s.mouthOpen, speaking ? 1 : 0, dt / TRANSITION);
    },
    draw(p: Painter) {
      switch (s.scene) {
        case 'library':
          drawLibrary(p, s);
          break;
        case 'request':
          drawRequest(p, s);
          break;
        case 'creating':
          drawCreating(p, s);
          break;
        case 'reveal':
          drawReveal(p, s);
          break;
        case 'complete':
          drawComplete(p, s);
          break;
      }
    },
  };
};
