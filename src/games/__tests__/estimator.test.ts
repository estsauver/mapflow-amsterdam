import { describe, it, expect } from 'vitest';
import { runProgram } from '@/lib/console/runProgram';
import { RecordingPainter } from '@/lib/console/RecordingPainter';
import { LOGICAL_HEIGHT } from '@/lib/console/layout';
import type { Input, TextStyle } from '@/lib/console/types';
import { createEstimatorGame } from '@/games/estimator';

// ---------------------------------------------------------------------------
// Timeline, derived from the timers in src/components/EstimatorGame.tsx.
// boot: 9 lines at 200 ms, a 10th tick clears the interval, +500 ms → input.
// input: 34 ticks at 80 ms type the prompt, a 35th tick clears, +1000 ms → sampling.
// sampling: 50 samples at 100 ms, a 51st tick clears, +500 ms percentiles, +2000 ms → distribution.
// distribution: 3000 ms → risks.
// risks: 4 reveals at 800 ms, a 5th tick clears, +3000 ms → shuttered (final, no loop).
// ---------------------------------------------------------------------------
const BOOT_END = 9 * 0.2 + 0.2 + 0.5; // 2.5
const INPUT_END = BOOT_END + 35 * 0.08 + 1.0; // 6.3
const SAMPLING_END = INPUT_END + 51 * 0.1 + 0.5 + 2.0; // 13.9
const DISTRIBUTION_END = SAMPLING_END + 3.0; // 16.9
const RISKS_END = DISTRIBUTION_END + 5 * 0.8 + 3.0; // 23.9
const FULL_RUN = RISKS_END + 2;

// Every string of the original script, verbatim. Multi-colour lines are split
// where the JSX splits them into separately styled text nodes.
const BOOT_LINES = [
  'UNIVERSAL ESTIMATOR v2.1.0',
  '(c) 2025 - Probability Systems Inc.',
  'Initializing token probability engine...',
  'Loading distribution models... OK',
  'Calibrating uncertainty bounds... OK',
  'READY.',
];
const PROMPT = '> ESTIMATE: Build user login system';
const CURSOR = '█';
const HEADER = 'UNIVERSAL ESTIMATOR';
const SAMPLING_TEXTS = [
  'Sampling probability distributions...',
  ' (50/50 samples)',
  'PROBABILITY',
  '1d', '2d', '3d', '4d', '5d', '6d', '7d', '8d', '10d', '14d',
  '├─ 50th percentile: ', '3 days',
  '├─ 80th percentile: ', '5 days',
  '└─ 95th percentile: ', '8+ days', ' ⚠️',
];
const DISTRIBUTION_TEXTS = [
  '╔══════════════════════════════════════╗',
  '║  PROBABILITY DISTRIBUTION COMPLETE   ║',
  '╚══════════════════════════════════════╝',
  'POINT ESTIMATE', '3 days', '← This is a lie',
  'REALISTIC RANGE', '3-8 days', '← This is truth',
  'The distribution reveals what point estimates hide.',
  'Analyzing risk factors...',
];
const RISK_ROWS = [
  ['Auth library integration', '+2d', '(30%)'],
  ['Unclear requirements', '+3d', '(45%)'],
  ['Testing edge cases', '+1d', '(60%)'],
  ['Code review cycles', '+1d', '(40%)'],
];
const RISK_TEXTS = [
  '⚠️', 'RISK FACTORS DETECTED:', '>',
  ...RISK_ROWS.flat(),
  'Total potential delay: +7 days',
  'Risk-adjusted estimate: 3-10 days (95% confidence)',
];
const SHUTTERED_TEXTS = [
  '⏻',
  'UNIVERSAL ESTIMATOR',
  '━━━━━━━━━━━━━━━━━━━━',
  'PROJECT SHUT DOWN',
  '2025',
  '"Point estimates are comfortable lies.',
  'Distributions are uncomfortable truths."',
  'Thanks for exploring.',
];

const lastTexts = (seconds: number, width = 960) => runProgram(createEstimatorGame, { seconds, width }).lastTexts.map(t => t.text);

describe('estimator: narrative', () => {
  it('plays the whole narrative for its real duration without errors and ends shut down', () => {
    const r = runProgram(createEstimatorGame, { seconds: FULL_RUN });
    expect(r.errors).toEqual([]);
    expect(r.frames).toBe(Math.round(FULL_RUN * 60));
    const final = r.lastTexts.map(t => t.text);
    for (const s of SHUTTERED_TEXTS) expect(final).toContain(s);
    expect(final).not.toContain('RISK FACTORS DETECTED:');
    expect(final).not.toContain(PROMPT);
  });

  it('does not loop: long after the end the screen is still the shut-down scene', () => {
    const final = lastTexts(60);
    for (const s of SHUTTERED_TEXTS) expect(final).toContain(s);
    expect(final).not.toContain(BOOT_LINES[0]);
  });

  it('is deterministic (seeded sampling, no Math.random or Date)', () => {
    const a = runProgram(createEstimatorGame, { seconds: SAMPLING_END });
    const b = runProgram(createEstimatorGame, { seconds: SAMPLING_END });
    expect(a.painter.counts).toEqual(b.painter.counts);
    expect([...a.textsSeen]).toEqual([...b.textsSeen]);
  });
});

describe('estimator: script', () => {
  const r = runProgram(createEstimatorGame, { seconds: FULL_RUN });
  const seen = r.textsSeen;

  it('draws every line of the original script', () => {
    const everything = [
      HEADER, ...BOOT_LINES, PROMPT, CURSOR,
      ...SAMPLING_TEXTS, ...DISTRIBUTION_TEXTS, ...RISK_TEXTS, ...SHUTTERED_TEXTS,
    ];
    const missing = everything.filter(s => !seen.has(s));
    expect(missing).toEqual([]);
  });

  it('types the prompt character by character and finishes with the complete line', () => {
    const prefixes = Array.from({ length: PROMPT.length - 1 }, (_, i) => PROMPT.slice(0, i + 2));
    for (const prefix of prefixes) expect(seen.has(prefix), prefix).toBe(true);
  });

  it('counts the samples up from 0 to 50', () => {
    for (let n = 0; n <= 50; n++) expect(seen.has(` (${n}/50 samples)`), `${n} samples`).toBe(true);
  });
});

describe('estimator: cadences', () => {
  it('boot log appears one line every 200 ms with a blinking cursor', () => {
    const early = lastTexts(0.5); // floor(0.5 / 0.2) = 2 lines
    expect(early).toContain(BOOT_LINES[0]);
    expect(early).toContain(BOOT_LINES[1]);
    expect(early).not.toContain(BOOT_LINES[2]);
    expect(early).toContain(CURSOR); // 0.53 s blink: visible for the first half-period
    expect(lastTexts(0.8)).not.toContain(CURSOR); // hidden during the second
    const beforeInput = lastTexts(BOOT_END - 0.1);
    for (const line of BOOT_LINES) expect(beforeInput).toContain(line);
    expect(beforeInput).not.toContain('> ');
  });

  it('input is typed at 80 ms per character and holds for a second before sampling', () => {
    // 0.84 s into the input scene: 10 ticks, the 11th not yet → 9 characters typed.
    expect(lastTexts(BOOT_END + 0.84)).toContain('> ESTIMATE:');
    const held = lastTexts(INPUT_END - 0.3);
    expect(held).toContain(PROMPT);
    expect(held).not.toContain('Sampling probability distributions...');
  });

  it('samples fall at 100 ms and land 400 ms later; percentiles appear after the last one', () => {
    // 2.04 s into sampling: 20 spawned, those spawned ≤ 1.64 s (16) have landed.
    const mid = lastTexts(INPUT_END + 2.04);
    expect(mid).toContain(' (16/50 samples)');
    expect(mid).not.toContain('3 days');
    const beforePercentiles = lastTexts(INPUT_END + 5.5);
    expect(beforePercentiles).toContain(' (50/50 samples)');
    expect(beforePercentiles).not.toContain('8+ days');
    const withPercentiles = lastTexts(SAMPLING_END - 0.3);
    expect(withPercentiles).toContain('8+ days');
    expect(withPercentiles).not.toContain('POINT ESTIMATE');
  });

  it('shows the distribution reveal for 3 s, then reveals risks every 800 ms and the total after the fourth', () => {
    const dist = lastTexts(DISTRIBUTION_END - 0.3);
    for (const s of DISTRIBUTION_TEXTS) expect(dist).toContain(s);
    expect(dist).not.toContain('RISK FACTORS DETECTED:');

    const two = lastTexts(DISTRIBUTION_END + 1.65); // floor(1.65 / 0.8) = 2 rows
    expect(two).toContain('RISK FACTORS DETECTED:');
    expect(two).toContain(RISK_ROWS[0][0]);
    expect(two).toContain(RISK_ROWS[1][0]);
    expect(two).not.toContain(RISK_ROWS[2][0]);
    expect(two).not.toContain('Total potential delay: +7 days');

    const all = lastTexts(RISKS_END - 0.3);
    for (const s of RISK_TEXTS) expect(all).toContain(s);
    expect(all).not.toContain('PROJECT SHUT DOWN');
    expect(lastTexts(RISKS_END + 0.3)).toContain('PROJECT SHUT DOWN');
  });
});

describe('estimator: interaction', () => {
  it('is a non-interactive terminal: clicks and keys neither break it, open links nor change the story', () => {
    const quiet = runProgram(createEstimatorGame, { seconds: FULL_RUN });
    const poked = runProgram(createEstimatorGame, {
      seconds: FULL_RUN,
      clicks: [1, 4, 8, 15, 18, 25].map(at => ({ at, x: 480, y: 270 })),
      keys: [{ at: 2, key: ' ' }, { at: 9, key: 'Enter' }, { at: 20, key: 'p' }],
    });
    expect(poked.errors).toEqual([]);
    expect(poked.opened).toEqual([]);
    expect([...poked.textsSeen]).toEqual([...quiet.textsSeen]);
    expect(poked.lastTexts.map(t => t.text)).toEqual(quiet.lastTexts.map(t => t.text));
  });
});

/** Records the box of every drawn text so the whole run can be bounds-checked. */
class BoundsPainter extends RecordingPainter {
  readonly boxes: { text: string; frame: number; x: number; y: number; w: number; h: number }[] = [];
  private frameNo = 0;
  beginFrame(frame: number, time?: number): void {
    super.beginFrame(frame, time);
    this.frameNo = frame;
  }
  text(text: string, x: number, y: number, style: TextStyle): number {
    const w = super.text(text, x, y, style);
    if (style.align && style.align !== 'left') throw new Error(`unexpected align ${style.align} for ${JSON.stringify(text)}`);
    if (style.baseline && style.baseline !== 'top') throw new Error(`unexpected baseline ${style.baseline} for ${JSON.stringify(text)}`);
    this.boxes.push({ text, frame: this.frameNo, x, y, w, h: style.size });
    return w;
  }
}

const idleInput: Input = {
  pointer: { x: -1, y: -1, down: false, justPressed: false, justReleased: false, inside: false },
  keysJustPressed: new Set(),
  keysDown: new Set(),
  frame: { width: 960, height: LOGICAL_HEIGHT },
};

describe.each([700, 1300])('estimator: layout at width %i', width => {
  it('keeps every text drawn in every frame inside the frame', () => {
    const painter = new BoundsPainter(width, LOGICAL_HEIGHT);
    const program = createEstimatorGame({ openUrl: () => {} });
    const fps = 60;
    const frames = Math.round(FULL_RUN * fps);
    for (let i = 0; i < frames; i++) {
      program.update(1 / fps, idleInput, i / fps);
      painter.beginFrame(i, i / fps);
      program.draw(painter);
    }
    expect(painter.boxes.length).toBeGreaterThan(frames); // something is drawn every frame
    const outside = painter.boxes.filter(b => b.x < 0 || b.y < 0 || b.x + b.w > width || b.y + b.h > LOGICAL_HEIGHT);
    expect(outside.slice(0, 5)).toEqual([]);
    // Nothing that must be read early is smaller than 16 logical px; nothing at all is below 14.
    const tiny = painter.boxes.filter(b => b.h < 14);
    expect(tiny.slice(0, 5)).toEqual([]);
    const earlySmall = painter.boxes.filter(b => b.frame < BOOT_END * fps && b.h < 16);
    expect(earlySmall.slice(0, 5)).toEqual([]);
    // The y-axis title is one readable string, not a column of glyphs.
    const axisLabels = painter.boxes.filter(b => b.text === 'PROBABILITY');
    expect(axisLabels.length).toBeGreaterThan(0);
    expect(axisLabels.filter(b => b.h < 16)).toEqual([]);
  });
});
