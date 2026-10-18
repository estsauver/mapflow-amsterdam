/**
 * Universal Estimator: a green-phosphor terminal that boots, takes a typed
 * estimate request, samples a probability distribution into a histogram,
 * reveals how a point estimate lies, lists risk factors and shuts down.
 *
 * Console port of src/components/EstimatorGame.tsx. The DOM original is the
 * specification: every string, cadence and colour below comes from it. DOM
 * pixel measurements are kept literally and scaled by S so 14 px terminal text
 * becomes 16 logical px (readable at the 8-bit stage's 216-line render).
 * Nothing is interactive; the narrative ends on the shut-down scene.
 */
import { seededRandom } from '@/lib/console/random';
import type { GameFactory, Painter, TextStyle } from '@/lib/console/types';

type Scene = 'boot' | 'input' | 'sampling' | 'distribution' | 'risks' | 'shuttered';

// --- Script ------------------------------------------------------------------

const BOOT_MESSAGES = [
  'UNIVERSAL ESTIMATOR v2.1.0',
  '(c) 2025 - Probability Systems Inc.',
  '',
  'Initializing token probability engine...',
  'Loading distribution models... OK',
  'Calibrating uncertainty bounds... OK',
  '',
  'READY.',
  '',
];

const INPUT_TEXT = 'ESTIMATE: Build user login system';

const DISTRIBUTION_BUCKETS = [
  { days: 1, height: 5, label: '1d' },
  { days: 2, height: 15, label: '2d' },
  { days: 3, height: 35, label: '3d' },
  { days: 4, height: 25, label: '4d' },
  { days: 5, height: 45, label: '5d' },
  { days: 6, height: 30, label: '6d' },
  { days: 7, height: 20, label: '7d' },
  { days: 8, height: 15, label: '8d' },
  { days: 10, height: 8, label: '10d' },
  { days: 14, height: 4, label: '14d' },
];

const RISK_FACTORS = [
  { name: 'Auth library integration', impact: '+2d', probability: '30%' },
  { name: 'Unclear requirements', impact: '+3d', probability: '45%' },
  { name: 'Testing edge cases', impact: '+1d', probability: '60%' },
  { name: 'Code review cycles', impact: '+1d', probability: '40%' },
];

const TOTAL_SAMPLES = 50;

// --- Timing (seconds), one constant per timer in the original ----------------

const CURSOR_BLINK = 0.53;
const BOOT_TICK = 0.2;
const BOOT_HOLD = 0.5;
const TYPE_TICK = 0.08;
const TYPE_HOLD = 1.0;
const SAMPLE_TICK = 0.1;
const SAMPLE_FALL = 0.4;
const BAR_TRANSITION = 0.3;
const PERCENTILES_DELAY = 0.5;
const PERCENTILES_HOLD = 2.0;
const DISTRIBUTION_HOLD = 3.0;
const RISK_TICK = 0.8;
const RISK_HOLD = 3.0;
const RISK_FADE = 0.3;
const RISK_STAGGER = 0.2;

/** Scene lengths: the interval ticks (including the one that clears it) plus the trailing timeout. */
const SCENE_LENGTH: Record<Exclude<Scene, 'shuttered'>, number> = {
  boot: (BOOT_MESSAGES.length + 1) * BOOT_TICK + BOOT_HOLD,
  input: (INPUT_TEXT.length + 2) * TYPE_TICK + TYPE_HOLD,
  sampling: (TOTAL_SAMPLES + 1) * SAMPLE_TICK + PERCENTILES_DELAY + PERCENTILES_HOLD,
  distribution: DISTRIBUTION_HOLD,
  risks: (RISK_FACTORS.length + 1) * RISK_TICK + RISK_HOLD,
};
const NEXT_SCENE: Record<Exclude<Scene, 'shuttered'>, Scene> = {
  boot: 'input',
  input: 'sampling',
  sampling: 'distribution',
  distribution: 'risks',
  risks: 'shuttered',
};

// --- Palette (Tailwind v3 defaults; "/N" opacity modifiers as rgba) ----------

const C = {
  black: '#000000',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  green900: '#14532d',
  red400: '#f87171',
  amber400: '#fbbf24',
  red500_50: 'rgba(239,68,68,0.5)',
  yellow500_50: 'rgba(234,179,8,0.5)',
  green500_50: 'rgba(34,197,94,0.5)',
  green950_20: 'rgba(5,46,22,0.2)',
  green950_50: 'rgba(5,46,22,0.5)',
  green500_10: 'rgba(34,197,94,0.1)',
  red950_30: 'rgba(69,10,10,0.3)',
  red800_50: 'rgba(153,27,27,0.5)',
  red500_70: 'rgba(239,68,68,0.7)',
  amber600_80: 'rgba(217,119,6,0.8)',
  phosphor: 'rgb(0,255,0)',
};

// --- Metrics -----------------------------------------------------------------

/** DOM px → logical px. 14 px (text-sm) terminal text becomes 16 logical px. */
const S = 16 / 14;
const s = (px: number) => px * S;
const PAD = s(32); // p-8
const HAIRLINE = 1; // 1 px borders

/** Font sizes: Tailwind text-xs/sm/lg/2xl/6xl scaled (xs clamped to the console's 14 px floor). */
const F = { xs: 14, sm: 16, lg: Math.round(s(18)), xl2: Math.round(s(24)), xl6: Math.round(s(60)) };
/** Line heights: Tailwind's per-size defaults, and leading-relaxed (1.625) where the original uses it. */
const LH = { xs: s(16), xsRelaxed: s(12 * 1.625), sm: s(20), smRelaxed: s(14 * 1.625), lg: s(28), xl2: s(32), xl6: s(60) };

// --- Easing / animation helpers ---------------------------------------------

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** CSS cubic-bezier(x1, y1, x2, y2) timing function, solved for y at a given x. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const at = (a: number, b: number, t: number) => 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (at(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}
const easeIn = cubicBezier(0.42, 0, 1, 1);
const easeOut = cubicBezier(0, 0, 0.58, 1);

/** Tailwind animate-pulse: opacity 1 ↔ 0.5 over 2 s. */
const pulse = (t: number) => 0.75 + 0.25 * Math.cos(Math.PI * t);

/** A CSS-style transition: restarts from the current displayed value whenever the target changes. */
interface Transition { from: number; to: number; start: number }
const transitionValue = (tr: Transition, t: number, duration: number) =>
  tr.start < 0 ? tr.to : tr.from + (tr.to - tr.from) * easeOut(clamp01((t - tr.start) / duration));
function retarget(tr: Transition, to: number, t: number, duration: number): void {
  tr.from = transitionValue(tr, t, duration);
  tr.to = to;
  tr.start = t;
}

/** Draws one line of text vertically centred in a DOM-style line box of height lh. Returns its width. */
function lineText(p: Painter, text: string, x: number, top: number, lh: number, style: TextStyle): number {
  return p.text(text, x, top + (lh - style.size) / 2, style);
}

export const createEstimatorGame: GameFactory = () => {
  const rng = seededRandom(0x45535431);

  // Each sample's bucket, drawn up front with the original's weighted selection
  // (weights are the bucket heights, skewed right).
  const weights = DISTRIBUTION_BUCKETS.map(b => b.height);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const sampleBucket: number[] = [];
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    let random = rng() * totalWeight;
    let bucketIndex = 0;
    for (let w = 0; w < weights.length; w++) {
      random -= weights[w];
      if (random <= 0) {
        bucketIndex = w;
        break;
      }
    }
    sampleBucket.push(bucketIndex);
  }

  let clock = 0;
  let scene: Scene = 'boot';
  let sceneT = 0;
  let landed = 0; // samples whose 400 ms fall has completed
  const bucketHeight: Transition[] = DISTRIBUTION_BUCKETS.map(() => ({ from: 0, to: 0, start: -1 }));
  const bucketFirstGrowth: number[] = DISTRIBUTION_BUCKETS.map(() => -1);

  const cursorVisible = () => Math.floor(clock / CURSOR_BLINK) % 2 === 0;
  const spawnTime = (i: number) => (i + 1) * SAMPLE_TICK;
  const landTime = (i: number) => spawnTime(i) + SAMPLE_FALL;
  const promptLine = () => `> ${INPUT_TEXT}`;

  function update(dt: number): void {
    clock += dt;
    sceneT += dt;
    while (scene !== 'shuttered' && sceneT >= SCENE_LENGTH[scene]) {
      sceneT -= SCENE_LENGTH[scene];
      scene = NEXT_SCENE[scene];
    }
    if (scene === 'sampling') {
      while (landed < TOTAL_SAMPLES && landTime(landed) <= sceneT) {
        const b = sampleBucket[landed];
        retarget(bucketHeight[b], Math.min(bucketHeight[b].to + 3, 100), sceneT, BAR_TRANSITION);
        if (bucketFirstGrowth[b] < 0) bucketFirstGrowth[b] = sceneT;
        landed++;
      }
    }
  }

  // --- Drawing ---------------------------------------------------------------

  function drawBackground(p: Painter): void {
    p.clear(C.black, 0);
    p.layer(0);
    // bg-gradient-to-b from-green-950/20 to-black
    p.gradient(0, 0, p.width, p.height, [[0, C.green950_20], [1, C.black]], 'down');
    // radial-gradient(ellipse at center, rgba(0,255,0,0.03) 0%, transparent 70%)
    p.glow(p.width / 2, p.height / 2, Math.max(p.width, p.height) * 0.7, C.phosphor, 0.03);
    p.layer(1);
  }

  /** Window chrome: three dots, the title, a rule. Returns the y where scene content starts. */
  function drawHeader(p: Painter): number {
    const rowH = LH.sm;
    const cy = PAD + rowH / 2;
    const dot = s(12); // w-3 h-3
    const gap = s(8); // gap-2
    [C.red500_50, C.yellow500_50, C.green500_50].forEach((color, i) => {
      p.circle(PAD + dot / 2 + i * (dot + gap), cy, dot / 2, color);
    });
    lineText(p, 'UNIVERSAL ESTIMATOR', PAD + 3 * dot + 2 * gap + s(16), PAD, rowH, { size: F.sm, color: C.green600 });
    const ruleY = PAD + rowH + s(8); // pb-2
    p.rect(PAD, ruleY, p.width - 2 * PAD, HAIRLINE, C.green900);
    return ruleY + HAIRLINE + s(16); // mb-4
  }

  function drawBootLog(p: Painter, top: number, count: number, color: string): number {
    let y = top;
    for (let i = 0; i < count; i++) {
      const msg = BOOT_MESSAGES[i];
      if (msg === '') {
        y += s(16); // h-4
      } else {
        lineText(p, msg, PAD, y, LH.smRelaxed, { size: F.sm, color });
        y += LH.smRelaxed;
      }
    }
    return y;
  }

  function drawBoot(p: Painter, top: number): void {
    const shown = Math.min(BOOT_MESSAGES.length, Math.floor(sceneT / BOOT_TICK));
    const y = drawBootLog(p, top, shown, C.green500);
    if (cursorVisible()) lineText(p, '█', PAD, y, LH.smRelaxed, { size: F.sm, color: C.green500 });
  }

  function drawInput(p: Painter, top: number): void {
    let y = drawBootLog(p, top, BOOT_MESSAGES.length, C.green700);
    y += s(16); // mt-4
    // The first 80 ms tick shows an empty slice; each later tick adds one character.
    const typed = Math.max(0, Math.min(INPUT_TEXT.length, Math.floor(sceneT / TYPE_TICK) - 1));
    const style = { size: F.sm, color: C.amber400 };
    const w = lineText(p, `> ${INPUT_TEXT.slice(0, typed)}`, PAD, y, LH.smRelaxed, style);
    if (cursorVisible()) lineText(p, '█', PAD + w, y, LH.smRelaxed, style);
  }

  function drawSampling(p: Painter, top: number): void {
    const contentW = p.width - 2 * PAD;
    let y = top;
    lineText(p, promptLine(), PAD, y, LH.sm, { size: F.sm, color: C.green600 });
    y += LH.sm + s(8); // mb-2
    const w = lineText(p, 'Sampling probability distributions...', PAD, y, LH.sm, { size: F.sm, color: C.amber400 });
    lineText(p, ` (${landed}/${TOTAL_SAMPLES} samples)`, PAD + w, y, LH.sm, { size: F.sm, color: C.amber400, alpha: pulse(clock) });
    y += LH.sm + s(16); // mb-4
    y += s(32); // mt-8

    // Histogram: h-48, ml-8, border-l border-b
    const hx = PAD + s(32);
    const hw = contentW - s(32);
    const hh = s(192);
    const bottom = y + hh;
    p.rect(hx, y, HAIRLINE, hh, C.green800);
    p.rect(hx, bottom - HAIRLINE, hw, HAIRLINE, C.green800);

    // Y-axis label: the DOM rotates "PROBABILITY" -90° beside the axis. The painter cannot rotate
    // text, so it is one horizontal title in the row just above the axis, starting in the ml-8
    // margin column, at 16 px so it stays legible at the 8-bit stage's 216-line render.
    lineText(p, 'PROBABILITY', PAD, y - LH.xs, LH.xs, { size: F.sm, color: C.green600 });

    // Buckets: justify-around inside px-2, each a w-6 bar over a text-xs label with mt-1.
    const labelStyle = { size: F.xs, color: C.green600 };
    const innerX = hx + s(8);
    const slot = (hw - 2 * s(8)) / DISTRIBUTION_BUCKETS.length;
    const labelTop = bottom - LH.xs;
    const barBottom = labelTop - s(4);
    const barW = s(24);
    DISTRIBUTION_BUCKETS.forEach((bucket, i) => {
      const cx = innerX + slot * (i + 0.5);
      lineText(p, bucket.label, cx - p.measureText(bucket.label, labelStyle) / 2, labelTop, LH.xs, labelStyle);
      const h = s(transitionValue(bucketHeight[i], sceneT, BAR_TRANSITION) * 1.5);
      if (h <= 0) return;
      // opacity transitions 0 → 0.8 alongside the first growth; box-shadow 0 0 10px rgba(34,197,94,0.5) as a halo
      const opacity = 0.8 * easeOut(clamp01((sceneT - bucketFirstGrowth[i]) / BAR_TRANSITION));
      const halo = s(10);
      p.rect(cx - barW / 2 - halo, barBottom - h - halo, barW + 2 * halo, h + 2 * halo, C.green500, 0.12 * opacity);
      p.rect(cx - barW / 2 - halo / 2, barBottom - h - halo / 2, barW + halo, h + halo, C.green500, 0.25 * opacity);
      p.rect(cx - barW / 2, barBottom - h, barW, h, C.green500, opacity);
    });

    // Falling samples: left 10% + 9% per bucket, fall 0.4 s ease-in to +180 px while fading out.
    const spawned = Math.min(TOTAL_SAMPLES, Math.floor(sceneT / SAMPLE_TICK));
    const dot = s(8);
    for (let i = landed; i < spawned; i++) {
      const e = easeIn(clamp01((sceneT - spawnTime(i)) / SAMPLE_FALL));
      const dx = hx + (hw * (10 + sampleBucket[i] * 9)) / 100;
      p.circle(dx + dot / 2, y + s(180) * e + dot / 2, dot / 2, C.amber400, 1 - e);
    }
    y = bottom;

    // Percentiles (mt-6, space-y-1, animate-pulse)
    if (sceneT >= (TOTAL_SAMPLES + 1) * SAMPLE_TICK + PERCENTILES_DELAY) {
      y += s(24);
      const a = pulse(clock);
      const green = { size: F.sm, color: C.green400, alpha: a };
      const amber = { size: F.sm, color: C.amber400, alpha: a };
      const red = { size: F.sm, color: C.red400, alpha: a };
      let x = PAD + lineText(p, '├─ 50th percentile: ', PAD, y, LH.sm, green);
      lineText(p, '3 days', x, y, LH.sm, amber);
      y += LH.sm + s(4);
      x = PAD + lineText(p, '├─ 80th percentile: ', PAD, y, LH.sm, green);
      lineText(p, '5 days', x, y, LH.sm, amber);
      y += LH.sm + s(4);
      x = PAD + lineText(p, '└─ 95th percentile: ', PAD, y, LH.sm, green);
      x += lineText(p, '8+ days', x, y, LH.sm, red);
      lineText(p, ' ⚠️', x, y, LH.sm, green);
    }
  }

  function drawDistribution(p: Painter, top: number): void {
    const contentW = p.width - 2 * PAD;
    let y = top;
    lineText(p, promptLine(), PAD, y, LH.sm, { size: F.sm, color: C.green600 });
    y += LH.sm + s(8); // mb-2
    y += s(16); // mt-4

    // bg-green-950/50 border border-green-800 rounded p-4
    const boxTop = y;
    const ix = PAD + HAIRLINE + s(16);
    const iw = contentW - 2 * (HAIRLINE + s(16));
    const gridH = LH.xs + s(4) + LH.xl2 + LH.xs;
    const boxH = HAIRLINE + s(16) + 3 * LH.lg + s(16) + gridH + s(16) + HAIRLINE + s(16) + LH.sm + s(16) + HAIRLINE;
    p.box(PAD, boxTop, contentW, boxH, { fill: C.green950_50, stroke: C.green800, lineWidth: HAIRLINE, radius: s(4) });

    y = boxTop + HAIRLINE + s(16);
    const title = { size: F.lg, color: C.amber400 };
    for (const line of ['╔══════════════════════════════════════╗', '║  PROBABILITY DISTRIBUTION COMPLETE   ║', '╚══════════════════════════════════════╝']) {
      lineText(p, line, ix, y, LH.lg, title);
      y += LH.lg;
    }
    y += s(16); // mb-4

    // grid grid-cols-2 gap-4
    const colW = (iw - s(16)) / 2;
    const rightX = ix + colW + s(16);
    const caption = { size: F.xs, color: C.green600 };
    lineText(p, 'POINT ESTIMATE', ix, y, LH.xs, caption);
    lineText(p, 'REALISTIC RANGE', rightX, y, LH.xs, caption);
    y += LH.xs + s(4); // mb-1
    const struck = { size: F.xl2, color: C.red500_70 };
    const strikeW = lineText(p, '3 days', ix, y, LH.xl2, struck);
    // text-decoration: line-through — the painter has no decoration, so rule it by hand through the x-height.
    const strikeY = y + (LH.xl2 - F.xl2) / 2 + F.xl2 * 0.55;
    p.line(ix, strikeY, ix + strikeW, strikeY, C.red500_70, 2);
    lineText(p, '3-8 days', rightX, y, LH.xl2, { size: F.xl2, color: C.green400 });
    y += LH.xl2;
    lineText(p, '← This is a lie', ix, y, LH.xs, { size: F.xs, color: C.red400 });
    lineText(p, '← This is truth', rightX, y, LH.xs, caption);
    y += LH.xs;

    y += s(16); // mt-4
    p.rect(ix, y, iw, HAIRLINE, C.green800); // border-t
    y += HAIRLINE + s(16); // pt-4
    lineText(p, 'The distribution reveals what point estimates hide.', ix, y, LH.sm, { size: F.sm, color: C.amber400 });

    y = boxTop + boxH + s(16); // mt-4
    lineText(p, 'Analyzing risk factors...', PAD, y, LH.sm, { size: F.sm, color: C.green600, alpha: pulse(clock) });
  }

  function drawRisks(p: Painter, top: number): void {
    const contentW = p.width - 2 * PAD;
    let y = top;
    lineText(p, promptLine(), PAD, y, LH.sm, { size: F.sm, color: C.green600 });
    y += LH.sm + s(8); // mb-2
    y += s(16); // mt-4

    const revealed = Math.min(RISK_FACTORS.length, Math.floor(sceneT / RISK_TICK));
    const allRevealed = revealed >= RISK_FACTORS.length;

    // bg-red-950/30 border border-red-800/50 rounded p-4
    const boxTop = y;
    const ix = PAD + HAIRLINE + s(16);
    const iw = contentW - 2 * (HAIRLINE + s(16));
    const rowsH = revealed * LH.sm + Math.max(0, revealed - 1) * s(8); // space-y-2
    const totalsH = allRevealed ? s(16) + HAIRLINE + s(16) + LH.sm + s(8) + LH.xs : 0;
    const boxH = HAIRLINE + s(16) + LH.sm + s(16) + rowsH + totalsH + s(16) + HAIRLINE;
    p.box(PAD, boxTop, contentW, boxH, { fill: C.red950_30, stroke: C.red800_50, lineWidth: HAIRLINE, radius: s(4) });

    y = boxTop + HAIRLINE + s(16);
    const warnW = lineText(p, '⚠️', ix, y, LH.sm, { size: F.sm, color: C.red400, alpha: pulse(clock) });
    lineText(p, 'RISK FACTORS DETECTED:', ix + warnW + s(8), y, LH.sm, { size: F.sm, color: C.red400 });
    y += LH.sm + s(16); // mb-4

    for (let i = 0; i < revealed; i++) {
      // animate-fadeIn 0.3s ease-out, staggered 0.2 s per row: opacity 0 → 1, translateX(-10px) → 0
      const revealedAt = (i + 1) * RISK_TICK + i * RISK_STAGGER;
      const e = easeOut(clamp01((sceneT - revealedAt) / RISK_FADE));
      const dx = -s(10) * (1 - e);
      const risk = RISK_FACTORS[i];
      const chevronW = lineText(p, '>', ix + dx, y, LH.sm, { size: F.sm, color: C.amber400, alpha: e });
      lineText(p, risk.name, ix + dx + chevronW + s(8), y, LH.sm, { size: F.sm, color: C.green400, alpha: e });
      lineText(p, risk.impact, ix + iw - 2 * s(64) + dx, y, LH.sm, { size: F.sm, color: C.red400, alpha: e });
      const prob = `(${risk.probability})`;
      const probStyle = { size: F.sm, color: C.green600, alpha: e };
      lineText(p, prob, ix + iw - p.measureText(prob, probStyle) + dx, y, LH.sm, probStyle);
      y += LH.sm + s(8);
    }

    if (allRevealed) {
      y += s(16) - s(8); // mt-4 (the last row's space-y gap is not a trailing margin)
      p.rect(ix, y, iw, HAIRLINE, C.red800_50); // border-t
      y += HAIRLINE + s(16); // pt-4
      lineText(p, 'Total potential delay: +7 days', ix, y, LH.sm, { size: F.sm, color: C.amber400 });
      y += LH.sm + s(8); // mt-2
      lineText(p, 'Risk-adjusted estimate: 3-10 days (95% confidence)', ix, y, LH.xs, { size: F.xs, color: C.green600 });
    }
  }

  function drawShuttered(p: Painter, top: number): void {
    const areaBottom = p.height - PAD;
    const gap = s(24); // space-y-6 (wins over the mb-4/mt-8/mt-6 on the children)
    const totalH = LH.xl6 + gap + LH.sm + s(4) + LH.sm + gap + LH.lg + gap + LH.sm + gap + 2 * LH.xsRelaxed + gap + LH.xs;
    let y = top + (areaBottom - top - totalH) / 2;
    const cx = p.width / 2;
    const centred = (text: string, lh: number, style: TextStyle) => {
      lineText(p, text, cx - p.measureText(text, style) / 2, y, lh, style);
      y += lh;
    };

    centred('⏻', LH.xl6, { size: F.xl6, color: C.green800 });
    y += gap;
    centred('UNIVERSAL ESTIMATOR', LH.sm, { size: F.sm, color: C.green600 });
    y += s(4); // space-y-1
    centred('━━━━━━━━━━━━━━━━━━━━', LH.sm, { size: F.sm, color: C.green800 });
    y += gap;
    centred('PROJECT SHUT DOWN', LH.lg, { size: F.lg, color: C.amber600_80 });
    y += gap;
    centred('2025', LH.sm, { size: F.sm, color: C.green800 });
    y += gap;
    centred('"Point estimates are comfortable lies.', LH.xsRelaxed, { size: F.xs, color: C.green700 });
    centred('Distributions are uncomfortable truths."', LH.xsRelaxed, { size: F.xs, color: C.green700 });
    y += gap;
    centred('Thanks for exploring.', LH.xs, { size: F.xs, color: C.green900 });

    // Subtle CRT flicker: opacity-5 wrapper over a pulsing transparent → green-500/10 → transparent gradient.
    p.push();
    p.alpha(0.05 * pulse(clock));
    p.gradient(0, 0, p.width, p.height, [[0, 'rgba(34,197,94,0)'], [0.5, C.green500_10], [1, 'rgba(34,197,94,0)']], 'down');
    p.pop();
  }

  function draw(p: Painter): void {
    drawBackground(p);
    const contentTop = drawHeader(p);
    switch (scene) {
      case 'boot':
        drawBoot(p, contentTop);
        break;
      case 'input':
        drawInput(p, contentTop);
        break;
      case 'sampling':
        drawSampling(p, contentTop);
        break;
      case 'distribution':
        drawDistribution(p, contentTop);
        break;
      case 'risks':
        drawRisks(p, contentTop);
        break;
      case 'shuttered':
        drawShuttered(p, contentTop);
        break;
    }
  }

  return { id: 'estimator', update, draw };
};
