/**
 * Apollo Farmer: a narrated farming simulation for Apollo Agriculture, ported
 * from src/components/FarmingGame.tsx onto the console. Scenes auto-advance
 * with a 30 ms typewriter and 2.5 s holds, a click anywhere advances, the
 * ⏸ PAUSE / ▶ AUTO toggle sits bottom-right and the story loops. The dialogue
 * border and the toggle fill brighten under the pointer, as their hover classes did.
 */
import { wrapWords } from '../lib/console/RecordingPainter';
import type { GameFactory, Input, Painter, PixelSprite, TextStyle } from '../lib/console/types';

// ---------------------------------------------------------------------------
// Script
// ---------------------------------------------------------------------------

type SceneId = 'intro' | 'loan_offer' | 'planting' | 'growing' | 'harvest' | 'success';
type Speaker = 'NARRATOR' | 'WANJIKU' | 'APOLLO AGENT' | 'SYSTEM' | 'SMS';

interface Line {
  speaker: Speaker;
  text: string;
  showNext: boolean;
}

const SCENES: Record<SceneId, Line[]> = {
  intro: [
    { speaker: 'NARRATOR', text: 'NAKURU COUNTY, KENYA...', showNext: true },
    { speaker: 'WANJIKU', text: 'Another season approaches... but seeds are expensive this year.', showNext: true },
    { speaker: 'WANJIKU', text: 'How will I afford quality seeds AND fertilizer?', showNext: true },
  ],
  loan_offer: [
    { speaker: 'APOLLO AGENT', text: "Hello! I'm from Apollo Agriculture.", showNext: true },
    { speaker: 'APOLLO AGENT', text: 'We can provide you with certified seeds and fertilizer on credit!', showNext: true },
    { speaker: 'WANJIKU', text: 'On credit? Tell me more...', showNext: true },
    { speaker: 'APOLLO AGENT', text: 'Pay after harvest! We also provide guidance via SMS.', showNext: true },
    { speaker: 'WANJIKU', text: 'This could change everything for my family!', showNext: true },
  ],
  planting: [
    { speaker: 'NARRATOR', text: 'Wanjiku receives her package...', showNext: true },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: Hybrid Maize Seeds (5kg)', showNext: true },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: DAP Fertilizer (10kg)', showNext: true },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: CAN Top-dress (10kg)', showNext: true },
    { speaker: 'WANJIKU', text: 'Time to plant! These seeds look healthy.', showNext: true },
  ],
  growing: [
    { speaker: 'NARRATOR', text: '3 months later...', showNext: true },
    { speaker: 'SMS', text: '📱 APOLLO: Apply top-dress now. Rain expected soon.', showNext: true },
    { speaker: 'WANJIKU', text: 'The SMS alerts really help with timing!', showNext: true },
    { speaker: 'NARRATOR', text: 'The crops grow strong and tall...', showNext: true },
  ],
  harvest: [
    { speaker: 'NARRATOR', text: 'HARVEST TIME', showNext: true },
    { speaker: 'WANJIKU', text: 'Look at this yield! Best harvest in years!', showNext: true },
    { speaker: 'SYSTEM', text: '🌽 HARVESTED: 15 bags of maize', showNext: true },
    { speaker: 'SYSTEM', text: '💰 SOLD: 12 bags @ 350 Gold Coins each', showNext: true },
    { speaker: 'SYSTEM', text: '✅ LOAN REPAID: 850 Gold Coins', showNext: true },
    { speaker: 'SYSTEM', text: '💵 PROFIT: 3,350 Gold Coins', showNext: true },
  ],
  success: [
    { speaker: 'WANJIKU', text: 'I can pay school fees AND save for next season!', showNext: true },
    { speaker: 'APOLLO AGENT', text: 'Your credit score has improved. Larger loan available next season!', showNext: true },
    { speaker: 'WANJIKU', text: 'Maybe I can expand to 2 acres...', showNext: true },
    { speaker: 'NARRATOR', text: '🌟 CYCLE COMPLETE - A BETTER LIFE THROUGH AGRICULTURE 🌟', showNext: false },
  ],
};

const SCENE_ORDER: SceneId[] = ['intro', 'loan_offer', 'planting', 'growing', 'harvest', 'success'];

/** Seconds per typed character (setInterval 30 ms in the original). */
const TYPE_INTERVAL = 0.03;
/** Seconds the finished line stays before auto-advancing. */
const HOLD = 2.5;
/** `transition-all duration-1000` on the sky and the sun. */
const SCENE_FADE = 1;
/** `transition-all duration-500` on the progress bar. */
const PROGRESS_FADE = 0.5;
/** `transition-colors` (150 ms) on the dialogue box's hover border and the toggle's hover fill. */
const HOVER_TRANSITION = 0.15;

// ---------------------------------------------------------------------------
// Palette (Tailwind v3 defaults plus the component's literal colours)
// ---------------------------------------------------------------------------

const SLATE_950 = '#020617';
const SLATE_900 = '#0f172a';
const SLATE_800 = '#1e293b';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const GREEN_200 = '#bbf7d0';
const GREEN_400 = '#4ade80';
const GREEN_500 = '#22c55e';
const GREEN_600 = '#16a34a';
const AMBER_400 = '#fbbf24';
const AMBER_900 = '#78350f';
const PURPLE_400 = '#c084fc';
const CYAN_400 = '#22d3ee';
const BLUE_400 = '#60a5fa';
const WHITE = '#ffffff';
const BLACK = '#000000';

const SKY_DAWN: readonly string[] = ['#1e3a5f', '#f97316', '#fbbf24'];
const SKY_DAY: readonly string[] = ['#3b82f6', '#60a5fa', '#93c5fd'];
const SKY_HARVEST: readonly string[] = ['#0ea5e9', '#38bdf8', '#7dd3fc'];
const FAR_RIDGE_RAMP: readonly string[] = ['#047857', '#059669', '#10B981'];
const NEAR_RIDGE_RAMP: readonly string[] = ['#059669', '#10B981', '#34D399'];
const FIELD_RAMP: readonly string[] = ['#92400E', '#78350F', '#451A03'];
const SUN_CORE = '#FCD34D';
const SUN_EDGE = '#F59E0B';

const SPEAKER_COLOR: Record<Speaker, string> = {
  WANJIKU: AMBER_400,
  'APOLLO AGENT': GREEN_400,
  NARRATOR: PURPLE_400,
  SYSTEM: CYAN_400,
  SMS: BLUE_400,
};

// ---------------------------------------------------------------------------
// Sprites (the component's SVG <rect>s, one character per art pixel)
// ---------------------------------------------------------------------------

type Emotion = 'neutral' | 'happy' | 'thinking';
type Variant = 'farmer' | 'agent';

/** H hair/eyes/belt, S skin, M mouth, T shirt, P pants, F feet. */
const FARMER_ROWS = [
  '...HHHHHH...',
  '..HHHHHHHH..',
  '...SSSSSS...',
  '..SSSSSSSS..',
  '..SSHSSHSS..',
  '..SSSSSSSS..',
  '...SSMMSS...',
  '...TTTTTT...',
  '.TTTTTTTTTT.',
  '.TTTTTTTTTT.',
  '.TTTTTTTTTT.',
  '.SSPHPPPPSS.',
  '...PHPPPP...',
  '...PHPPPP...',
  '...FF..FF...',
  '...FF..FF...',
];
const FARMER_ROWS_THINKING = FARMER_ROWS.map((row, i) => (i === 6 ? '...SSSMSS...' : row));

function farmerSprite(variant: Variant, emotion: Emotion): PixelSprite {
  return {
    rows: emotion === 'thinking' ? FARMER_ROWS_THINKING : FARMER_ROWS,
    palette: {
      H: '#1a1a1a',
      S: '#8B6914',
      M: emotion === 'happy' ? '#DC2626' : '#7C2D12',
      T: variant === 'agent' ? '#4ADE80' : '#F59E0B',
      P: variant === 'agent' ? '#1F2937' : '#7C3AED',
      F: '#4B3621',
    },
  };
}

const FARMERS: Record<Variant, Record<Emotion, PixelSprite>> = {
  farmer: { neutral: farmerSprite('farmer', 'neutral'), happy: farmerSprite('farmer', 'happy'), thinking: farmerSprite('farmer', 'thinking') },
  agent: { neutral: farmerSprite('agent', 'neutral'), happy: farmerSprite('agent', 'happy'), thinking: farmerSprite('agent', 'thinking') },
};

/** g stalk/leaf, d dark leaf/husk, c corn cob, t tassel, s soil, b seed. */
const CROP_PALETTE = { g: '#22C55E', d: '#16A34A', c: '#FCD34D', t: '#D4A574', s: '#8B4513', b: '#D2691E' };

type CropStage = 'seed' | 'sprout' | 'growing' | 'mature';

const CROPS: Record<CropStage, PixelSprite> = {
  seed: {
    palette: CROP_PALETTE,
    rows: ['......', '......', '......', '......', '......', '..bb..', '..ss..', '......'],
  },
  // Defined by the original but never reached by its scene -> stage mapping.
  sprout: {
    palette: CROP_PALETTE,
    rows: ['......', '......', '......', '......', '..gg..', '.dggd.', '..gg..', '..ss..'],
  },
  growing: {
    palette: CROP_PALETTE,
    rows: [
      '......',
      '......',
      '......',
      '..gggg',
      'gggggg',
      'gggg..',
      '..ggdd',
      '..ggdd',
      'ddggdd',
      'ddgg..',
      'ddgg..',
      '..gg..',
      '..gg..',
      '..gg..',
      '.ssss.',
    ],
  },
  mature: {
    palette: CROP_PALETTE,
    rows: [
      '.t.t..',
      '.ttt..',
      'ttttt.',
      'ttttt.',
      '..gg..',
      '..gg..',
      '..gg..',
      '..gg..',
      '..gggg',
      '..gggg',
      'ggggdg',
      'ggggcc',
      'ggggcc',
      '..ggcc',
      '.dggcc',
      'ccggdd',
      'ccggdd',
      'ccgg..',
      'ccgg..',
      '..gg..',
      '..ggdd',
      '..ggdd',
      'ddggdd',
      'ddggdd',
      'ddgg..',
      'ddgg..',
      '..gg..',
      '..gg..',
      '..gg..',
      '.ssss.',
    ],
  },
};

/** The SVGs were 24 x N px per 6 x N art pixels at scale 2: 8 logical px per art pixel. */
const CROP_SCALE = 8;
/** 48 x 64 px per 12 x 16 art pixels at scale 1.5: 6 logical px per art pixel. */
const PORTRAIT_SCALE = 6;

// ---------------------------------------------------------------------------
// Scenery
// ---------------------------------------------------------------------------

/** Upper edge of each ridge as the clip-path's (x%, y%) pairs, left to right; the bottom edge is implicit. */
const FAR_RIDGE: ReadonlyArray<readonly [number, number]> = [
  [0, 100], [5, 60], [15, 80], [25, 40], [35, 70], [45, 30], [55, 60], [65, 20], [75, 50], [85, 35], [95, 55], [100, 25],
];
const NEAR_RIDGE: ReadonlyArray<readonly [number, number]> = [
  [0, 100], [10, 50], [20, 70], [30, 40], [45, 65], [55, 35], [70, 55], [80, 45], [90, 60], [100, 40],
];

/** [top fraction, left fraction, width px, height px] of the four `bg-white/70 rounded-full blur-sm` clouds. */
const CLOUDS: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.15, 0.1, 128, 48],
  [0.12, 0.15, 96, 40],
  [0.2, 0.6, 160, 56],
  [0.18, 0.65, 112, 40],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** CSS `ease`, cubic-bezier(0.25, 0.1, 0.25, 1): bisect the x polynomial, then evaluate y. */
function ease(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bezier = (t: number, p1: number, p2: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bezier(mid, 0.25, 0.25) < x) lo = mid;
    else hi = mid;
  }
  return bezier((lo + hi) / 2, 0.1, 1);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function lerpColor(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const mix = (i: number) => Math.round(ca[i] + (cb[i] - ca[i]) * t);
  return `#${((mix(0) << 16) | (mix(1) << 8) | mix(2)).toString(16).padStart(6, '0')}`;
}

/** Colour at position t in a three-stop ramp (0%, 50%, 100%). */
function rampAt(ramp: readonly string[], t: number): string {
  return t < 0.5 ? lerpColor(ramp[0], ramp[1], t * 2) : lerpColor(ramp[1], ramp[2], (t - 0.5) * 2);
}

/** A CSS-style transition of one number: retargeting mid-flight starts from the current value. */
class Tween {
  private from: number;
  private to: number;
  private t = 1;

  constructor(public value: number, private readonly duration: number) {
    this.from = value;
    this.to = value;
  }

  set(target: number): void {
    if (target === this.to) return;
    this.from = this.value;
    this.to = target;
    this.t = 0;
  }

  step(dt: number): void {
    if (this.t >= 1) return;
    this.t = Math.min(1, this.t + dt / this.duration);
    this.value = this.from + (this.to - this.from) * ease(this.t);
  }
}

/** The same for a three-stop colour ramp, interpolating each stop. */
class RampTween {
  private from: readonly string[];
  private to: readonly string[];
  private t = 1;

  constructor(initial: readonly string[], private readonly duration: number) {
    this.from = initial;
    this.to = initial;
  }

  set(target: readonly string[]): void {
    if (target === this.to) return;
    this.from = this.current();
    this.to = target;
    this.t = 0;
  }

  step(dt: number): void {
    if (this.t < 1) this.t = Math.min(1, this.t + dt / this.duration);
  }

  current(): readonly string[] {
    if (this.t >= 1) return this.to;
    const k = ease(this.t);
    return this.to.map((c, i) => lerpColor(this.from[i], c, k));
  }
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** `text.slice(0, units)` without ever ending on half of a surrogate pair (the emoji appears one tick later). */
function typedPrefix(text: string, units: number): string {
  const s = text.slice(0, units);
  const last = s.charCodeAt(s.length - 1);
  return last >= 0xd800 && last <= 0xdbff ? s.slice(0, -1) : s;
}

function mono(size: number, color: string, extra: Partial<TextStyle> = {}): TextStyle {
  return { size, color, font: 'mono', ...extra };
}

/** The `box-sizing: border-box` look: a fill, then a stroke drawn fully inside the rectangle. */
function framedBox(p: Painter, r: Rect, fill: string, fillAlpha: number, stroke: string, lineWidth: number, radius: number): void {
  p.box(r.x, r.y, r.w, r.h, { fill, alpha: fillAlpha, radius });
  p.box(r.x + lineWidth / 2, r.y + lineWidth / 2, r.w - lineWidth, r.h - lineWidth, { stroke, lineWidth, radius: Math.max(0, radius - lineWidth / 2) });
}

/**
 * A ridge (an x-monotone upper edge over a flat base) filled with a 135° three-stop
 * gradient. The painter's polygon takes one colour, so the ridge is cut into vertical
 * strips, each coloured by the CSS gradient position of its centre.
 */
function gradientRidge(p: Painter, profile: ReadonlyArray<readonly [number, number]>, box: Rect, ramp: readonly string[], alpha: number): void {
  const pts = profile.map(([px, py]) => [box.x + (box.w * px) / 100, box.y + (box.h * py) / 100] as const);
  const bottom = box.y + box.h;
  const yAt = (x: number): number => {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      if (x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
    return pts[pts.length - 1][1];
  };
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const strips = Math.max(8, Math.round(box.w / 40));
  for (let i = 0; i < strips; i++) {
    const x0 = box.x + (box.w * i) / strips;
    const x1 = box.x + (box.w * (i + 1)) / strips;
    const poly: (readonly [number, number])[] = [[x0, bottom], [x0, yAt(x0)]];
    for (const pt of pts) if (pt[0] > x0 && pt[0] < x1) poly.push(pt);
    poly.push([x1, yAt(x1)], [x1, bottom]);
    const xm = (x0 + x1) / 2;
    const ym = (yAt(xm) + bottom) / 2;
    // Position along a 135deg gradient line (towards bottom-right) whose ends touch the box corners.
    const t = Math.min(1, Math.max(0, 0.5 + (xm - cx + (ym - cy)) / (box.w + box.h)));
    p.polygon(poly, rampAt(ramp, t), alpha);
  }
}

// ---------------------------------------------------------------------------
// Scene-derived state
// ---------------------------------------------------------------------------

function cropStage(scene: SceneId): CropStage | null {
  switch (scene) {
    case 'planting':
      return 'seed';
    case 'growing':
      return 'growing';
    case 'harvest':
    case 'success':
      return 'mature';
    default:
      return null;
  }
}

function skyFor(scene: SceneId): readonly string[] {
  if (scene === 'intro') return SKY_DAWN;
  if (scene === 'harvest' || scene === 'success') return SKY_HARVEST;
  return SKY_DAY;
}

/** The sun's `top`: 50% during the intro, 10% afterwards. */
const sunTopFor = (scene: SceneId) => (scene === 'intro' ? 0.5 : 0.1);

function statsFor(sceneIndex: number) {
  return {
    season: 'Long Rains',
    year: '2024',
    location: 'Nakuru, Kenya',
    credit: sceneIndex >= 2 ? (sceneIndex >= 5 ? 'REPAID' : 'ACTIVE') : 'NONE',
    yield: sceneIndex >= 4 ? 'A lot...' : sceneIndex >= 3 ? 'More...' : '--',
  };
}

const emotionFor = (text: string): Emotion => (text.includes('?') ? 'thinking' : text.includes('!') ? 'happy' : 'neutral');

// ---------------------------------------------------------------------------
// The game
// ---------------------------------------------------------------------------

export const createFarmingGame: GameFactory = () => {
  let sceneIndex = 0;
  let lineIndex = 0;
  /** Seconds since the current line started typing. */
  let typedElapsed = 0;
  let typing = true;
  /** Seconds the finished line has been held while auto-playing. */
  let hold = 0;
  let autoPlaying = true;
  let clock = 0;

  const sky = new RampTween(SKY_DAWN, SCENE_FADE);
  const sunTop = new Tween(sunTopFor('intro'), SCENE_FADE);
  const progress = new Tween(0, PROGRESS_FADE);

  /** The toggle's hit rect, laid out in draw() and hit-tested in update(). */
  let toggleRect: Rect = { x: 960 - 16 - 96, y: 540 - 16 - 32, w: 96, h: 32 };
  /** The dialogue box as drawn last frame, for the hover hit-test; null until the first draw. */
  let dialogueRect: Rect | null = null;
  /** 0..1 progress of the toggle's `hover:bg-slate-700` fill. */
  let toggleHover = 0;
  /** 0..1 progress of the dialogue box's `hover:border-slate-400` border. */
  let boxHover = 0;

  const scene = () => SCENE_ORDER[sceneIndex];
  const line = () => SCENES[scene()][lineIndex];
  const typingDuration = () => (line().text.length + 1) * TYPE_INTERVAL;

  const retarget = () => {
    sky.set(skyFor(scene()));
    sunTop.set(sunTopFor(scene()));
    progress.set((sceneIndex * 10 + lineIndex) / (SCENE_ORDER.length * 5));
  };

  const startLine = () => {
    typedElapsed = 0;
    typing = true;
    hold = 0;
    retarget();
  };

  const next = () => {
    if (typing) {
      typedElapsed = typingDuration();
      typing = false;
      hold = 0;
      return;
    }
    if (lineIndex < SCENES[scene()].length - 1) {
      lineIndex++;
    } else if (sceneIndex < SCENE_ORDER.length - 1) {
      sceneIndex++;
      lineIndex = 0;
    } else {
      sceneIndex = 0;
      lineIndex = 0;
    }
    startLine();
  };

  const toggleAutoPlay = () => {
    autoPlaying = !autoPlaying;
    hold = 0;
  };

  function update(dt: number, input: Input): void {
    clock += dt;
    const pointer = input.pointer;
    // Hover follows the DOM's stacking: the z-30 toggle sits above the dialogue wrapper and
    // is not its descendant, so a pointer over the toggle hovers the toggle alone.
    const overToggle = pointer.inside && inRect(toggleRect, pointer.x, pointer.y);
    const overBox = !overToggle && pointer.inside && dialogueRect !== null && inRect(dialogueRect, pointer.x, pointer.y);
    toggleHover = clamp01(toggleHover + (overToggle ? dt : -dt) / HOVER_TRANSITION);
    boxHover = clamp01(boxHover + (overBox ? dt : -dt) / HOVER_TRANSITION);
    if (pointer.justPressed) {
      if (inRect(toggleRect, pointer.x, pointer.y)) toggleAutoPlay();
      else next();
    }
    // The overshoot past each boundary carries into the next phase, so the cadence
    // matches the original's timers exactly instead of drifting a frame per line.
    if (typing) {
      typedElapsed += dt;
      const duration = typingDuration();
      if (typedElapsed >= duration) {
        typing = false;
        hold = typedElapsed - duration;
      }
    } else if (autoPlaying) {
      hold += dt;
      if (hold >= HOLD) {
        const carry = hold - HOLD;
        next();
        typedElapsed = carry;
      }
    }
    sky.step(dt);
    sunTop.step(dt);
    progress.step(dt);
  }

  function drawScenery(p: Painter): void {
    const W = p.width;
    const H = p.height;
    p.layer(0);
    p.clear(SLATE_950, 0);
    const [s0, s1, s2] = sky.current();
    p.gradient(0, 0, W, H, [[0, s0], [0.5, s1], [1, s2]], 'down');

    // Sun: 120 px disc, radial #FCD34D -> #F59E0B, glows of 60 and 120 px, right: 20%.
    const sx = W * 0.8 - 60;
    const sy = sunTop.value * H + 60;
    p.glow(sx, sy, 180, SUN_EDGE, 0.5);
    p.glow(sx, sy, 120, SUN_CORE, 0.6);
    const rings = 8;
    for (let i = 0; i < rings; i++) {
      const r = 60 * (1 - i / rings);
      // radial-gradient(circle ...) reaches 100% at the farthest corner, 60*sqrt(2) px out.
      p.circle(sx, sy, r, lerpColor(SUN_CORE, SUN_EDGE, r / (60 * Math.SQRT2)));
    }

    for (const [top, left, w, h] of CLOUDS) {
      const cx = left * W + w / 2;
      const cy = top * H + h / 2;
      p.ellipse(cx, cy, w / 2 + 4, h / 2 + 4, WHITE, 0.25); // blur-sm halo
      p.ellipse(cx, cy, w / 2, h / 2, WHITE, 0.7);
    }

    gradientRidge(p, FAR_RIDGE, { x: 0, y: H * 0.7 - 200, w: W, h: 200 }, FAR_RIDGE_RAMP, 0.6);
    gradientRidge(p, NEAR_RIDGE, { x: 0, y: H * 0.8 - 150, w: W, h: 150 }, NEAR_RIDGE_RAMP, 1);
  }

  function drawField(p: Painter): void {
    const W = p.width;
    const H = p.height;
    p.layer(1);
    const fieldH = H * 0.25;
    const fieldY = H - fieldH;
    p.gradient(0, fieldY, W, fieldH, [[0, FIELD_RAMP[0]], [0.5, FIELD_RAMP[1]], [1, FIELD_RAMP[2]]], 'down');
    for (let i = 0; i < 6; i++) p.rect(0, H - fieldH * (0.15 + i * 0.15), W, 1, AMBER_900, 0.5);

    const stage = cropStage(scene());
    if (!stage) return;
    const sprite = CROPS[stage];
    const spriteW = sprite.rows[0].length * CROP_SCALE;
    const spriteH = sprite.rows.length * CROP_SCALE;
    const baseline = H * 0.95;
    const left = W * 0.05;
    const slot = (W * 0.9) / 10;
    for (let i = 0; i < 10; i++) {
      const cx = left + slot * (i + 0.5);
      p.sprite(sprite, cx - spriteW / 2, baseline - spriteH, { scale: CROP_SCALE });
    }
  }

  function drawStats(p: Painter): void {
    const stats = statsFor(sceneIndex);
    const rows: { text: string; color: string }[] = [
      { text: `📍 ${stats.location}`, color: WHITE },
      { text: `🌱 Season: ${stats.season}`, color: WHITE },
      { text: `📅 Year: ${stats.year}`, color: WHITE },
      { text: `💳 Credit: ${stats.credit}`, color: stats.credit === 'ACTIVE' ? AMBER_400 : stats.credit === 'REPAID' ? GREEN_400 : SLATE_500 },
      { text: `📈 Yield vs Traditional: ${stats.yield}`, color: stats.yield !== '--' ? GREEN_400 : SLATE_500 },
    ];
    const title = '═══ FARM STATUS ═══';
    const size = 16;
    const lineH = 22;
    const pad = 12;
    const border = 2;
    const titleStyle = mono(size, GREEN_400, { weight: 'bold' });
    let textW = p.measureText(title, titleStyle);
    for (const r of rows) textW = Math.max(textW, p.measureText(r.text, mono(size, r.color)));
    const box: Rect = { x: 16, y: 16, w: textW + 2 * (pad + border), h: 2 * border + pad + lineH + 12 + rows.length * lineH + (rows.length - 1) * 4 + pad };
    framedBox(p, box, SLATE_900, 0.9, SLATE_600, border, 8);
    const x = box.x + border + pad;
    let y = box.y + border + pad;
    p.text(title, x, y + (lineH - size) / 2, titleStyle);
    y += lineH + 12;
    for (const r of rows) {
      p.text(r.text, x, y + (lineH - size) / 2, mono(size, r.color));
      y += lineH + 4;
    }
  }

  function drawBadge(p: Painter): void {
    const title = 'APOLLO FARMER';
    const sub = 'SEEDS OF PROSPERITY';
    const titleStyle = mono(16, WHITE, { weight: 'bold', letterSpacing: 1.6, align: 'center' });
    const subStyle = mono(12, GREEN_200, { align: 'center' });
    const w = Math.max(p.measureText(title, titleStyle), p.measureText(sub, subStyle)) + 2 * 16 + 2 * 2;
    const h = 2 * 2 + 2 * 8 + 22 + 16;
    const box: Rect = { x: p.width / 2 - w / 2, y: 16, w, h };
    framedBox(p, box, GREEN_600, 0.9, GREEN_400, 2, 8);
    p.text(title, p.width / 2, box.y + 2 + 8 + 3, titleStyle);
    p.text(sub, p.width / 2, box.y + 2 + 8 + 22 + 2, subStyle);
  }

  function drawDialogue(p: Painter): void {
    const W = p.width;
    const H = p.height;
    const current = line();
    const border = 4;
    const pad = 24;
    const speakerSize = 16;
    const speakerLineH = 24;
    const textSize = 20;
    const textLineH = 32.5; // leading-relaxed
    const textStyle = mono(textSize, WHITE);

    // max-w-2xl (672 px) wrapper with px-8, centred, bottom-8.
    const boxW = Math.min(W, 672) - 64;
    const innerW = boxW - 2 * (border + pad);
    const fullLines = wrapWords(current.text, innerW, s => p.measureText(s, textStyle));
    const textAreaH = Math.max(64, fullLines.length * textLineH); // min-h-[4rem]
    const boxH = 2 * border + pad + speakerLineH + 8 + textAreaH + pad;
    const box: Rect = { x: (W - boxW) / 2, y: H - 32 - boxH, w: boxW, h: boxH };
    dialogueRect = box;

    // Portrait, 144 px above the box and 16 px in from its left edge.
    if (current.speaker === 'WANJIKU' || current.speaker === 'APOLLO AGENT') {
      const frame: Rect = { x: box.x + 16, y: box.y - 144, w: 12 * PORTRAIT_SCALE + 32, h: 16 * PORTRAIT_SCALE + 32 };
      framedBox(p, frame, SLATE_900, 0.9, SLATE_600, 4, 4);
      const variant: Variant = current.speaker === 'APOLLO AGENT' ? 'agent' : 'farmer';
      p.sprite(FARMERS[variant][emotionFor(current.text)], frame.x + 16, frame.y + 16, { scale: PORTRAIT_SCALE });
    }

    // 0 10px 40px rgba(0,0,0,0.5) drop shadow, then the box with its inset bevel.
    p.box(box.x - 10, box.y, box.w + 20, box.h + 20, { fill: BLACK, alpha: 0.12, radius: 20 });
    p.box(box.x - 4, box.y + 6, box.w + 8, box.h + 8, { fill: BLACK, alpha: 0.15, radius: 12 });
    p.box(box.x, box.y + 10, box.w, box.h, { fill: BLACK, alpha: 0.2, radius: 8 });
    framedBox(p, box, SLATE_900, 0.95, lerpColor(SLATE_500, SLATE_400, boxHover), border, 8);
    p.rect(box.x + border, box.y + border, box.w - 2 * border, 2, WHITE, 0.1);
    p.rect(box.x + border, box.y + border, 2, box.h - 2 * border, WHITE, 0.1);
    p.rect(box.x + border, box.y + box.h - border - 2, box.w - 2 * border, 2, BLACK, 0.3);
    p.rect(box.x + box.w - border - 2, box.y + border, 2, box.h - 2 * border, BLACK, 0.3);

    const x = box.x + border + pad;
    let y = box.y + border + pad;
    p.text(`[${current.speaker}]`, x, y + (speakerLineH - speakerSize) / 2, mono(speakerSize, SPEAKER_COLOR[current.speaker], { weight: 'bold', letterSpacing: 0.8 }));
    y += speakerLineH + 8;

    const units = Math.min(current.text.length, Math.floor(typedElapsed / TYPE_INTERVAL + 1e-9));
    const shown = typedPrefix(current.text, units);
    const lines = wrapWords(shown, innerW, s => p.measureText(s, textStyle));
    lines.forEach((l, i) => p.text(l, x, y + i * textLineH + (textLineH - textSize) / 2, textStyle));
    if (typing) {
      const last = lines[lines.length - 1];
      const cx = x + p.measureText(last, textStyle);
      const cy = y + (lines.length - 1) * textLineH + (textLineH - textSize) / 2;
      p.text('▌', cx, cy, mono(textSize, WHITE, { alpha: 0.75 + 0.25 * Math.cos(Math.PI * clock) })); // animate-pulse
    } else {
      if (current.showNext) {
        const hop = -7 * (0.5 + 0.5 * Math.cos(2 * Math.PI * clock)); // animate-bounce: translateY(-25%) of a 28 px line
        p.text('▼', box.x + box.w - border - 24, box.y + box.h - border - 12 - 28 + 4 + hop, mono(textSize, WHITE, { align: 'right' }));
      }
      p.text('[CLICK TO CONTINUE]', x, box.y + box.h - border - 12 - 20 + 3, mono(14, SLATE_500));
    }
  }

  function drawToggle(p: Painter): void {
    const label = autoPlaying ? '⏸ PAUSE' : '▶ AUTO';
    const style = mono(14, WHITE);
    const w = p.measureText(label, style) + 2 * 12 + 2 * 2;
    const h = 2 * 2 + 2 * 4 + 20;
    toggleRect = { x: p.width - 16 - w, y: p.height - 16 - h, w, h };
    // bg-slate-800/90 at rest; hover:bg-slate-700 carries no opacity modifier, so the fill also goes opaque.
    framedBox(p, toggleRect, lerpColor(SLATE_800, SLATE_700, toggleHover), 0.9 + 0.1 * toggleHover, SLATE_600, 2, 4);
    p.text(label, toggleRect.x + 2 + 12, toggleRect.y + 2 + 4 + 3, style);
  }

  function drawProgress(p: Painter): void {
    p.rect(0, p.height - 4, p.width, 4, SLATE_800);
    p.rect(0, p.height - 4, p.width * Math.min(1, progress.value), 4, GREEN_500);
  }

  function draw(p: Painter): void {
    drawScenery(p);
    drawField(p);
    p.layer(2);
    drawStats(p);
    drawBadge(p);
    drawDialogue(p);
    drawToggle(p);
    drawProgress(p);
  }

  return { id: 'farming', update, draw };
};
