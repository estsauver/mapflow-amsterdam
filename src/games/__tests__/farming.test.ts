import { describe, it, expect } from 'vitest';
import { runProgram, type RunOptions } from '../../lib/console/runProgram';
import { RecordingPainter } from '../../lib/console/RecordingPainter';
import { LOGICAL_HEIGHT } from '../../lib/console/layout';
import type { BoxStyle, Input } from '../../lib/console/types';
import { createFarmingGame } from '../farming';

// The script, verbatim from src/components/FarmingGame.tsx (the specification).
const SCRIPT: Record<string, { speaker: string; text: string }[]> = {
  intro: [
    { speaker: 'NARRATOR', text: 'NAKURU COUNTY, KENYA...' },
    { speaker: 'WANJIKU', text: 'Another season approaches... but seeds are expensive this year.' },
    { speaker: 'WANJIKU', text: 'How will I afford quality seeds AND fertilizer?' },
  ],
  loan_offer: [
    { speaker: 'APOLLO AGENT', text: "Hello! I'm from Apollo Agriculture." },
    { speaker: 'APOLLO AGENT', text: 'We can provide you with certified seeds and fertilizer on credit!' },
    { speaker: 'WANJIKU', text: 'On credit? Tell me more...' },
    { speaker: 'APOLLO AGENT', text: 'Pay after harvest! We also provide guidance via SMS.' },
    { speaker: 'WANJIKU', text: 'This could change everything for my family!' },
  ],
  planting: [
    { speaker: 'NARRATOR', text: 'Wanjiku receives her package...' },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: Hybrid Maize Seeds (5kg)' },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: DAP Fertilizer (10kg)' },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: CAN Top-dress (10kg)' },
    { speaker: 'WANJIKU', text: 'Time to plant! These seeds look healthy.' },
  ],
  growing: [
    { speaker: 'NARRATOR', text: '3 months later...' },
    { speaker: 'SMS', text: '📱 APOLLO: Apply top-dress now. Rain expected soon.' },
    { speaker: 'WANJIKU', text: 'The SMS alerts really help with timing!' },
    { speaker: 'NARRATOR', text: 'The crops grow strong and tall...' },
  ],
  harvest: [
    { speaker: 'NARRATOR', text: 'HARVEST TIME' },
    { speaker: 'WANJIKU', text: 'Look at this yield! Best harvest in years!' },
    { speaker: 'SYSTEM', text: '🌽 HARVESTED: 15 bags of maize' },
    { speaker: 'SYSTEM', text: '💰 SOLD: 12 bags @ 350 Gold Coins each' },
    { speaker: 'SYSTEM', text: '✅ LOAN REPAID: 850 Gold Coins' },
    { speaker: 'SYSTEM', text: '💵 PROFIT: 3,350 Gold Coins' },
  ],
  success: [
    { speaker: 'WANJIKU', text: 'I can pay school fees AND save for next season!' },
    { speaker: 'APOLLO AGENT', text: 'Your credit score has improved. Larger loan available next season!' },
    { speaker: 'WANJIKU', text: 'Maybe I can expand to 2 acres...' },
    { speaker: 'NARRATOR', text: '🌟 CYCLE COMPLETE - A BETTER LIFE THROUGH AGRICULTURE 🌟' },
  ],
};
const SCENE_ORDER = ['intro', 'loan_offer', 'planting', 'growing', 'harvest', 'success'];
const LINES = SCENE_ORDER.flatMap(s => SCRIPT[s]);

const HUD_TEXT = [
  '═══ FARM STATUS ═══',
  '📍 Nakuru, Kenya',
  '🌱 Season: Long Rains',
  '📅 Year: 2024',
  '💳 Credit: NONE',
  '💳 Credit: ACTIVE',
  '💳 Credit: REPAID',
  '📈 Yield vs Traditional: --',
  '📈 Yield vs Traditional: More...',
  '📈 Yield vs Traditional: A lot...',
  'APOLLO FARMER',
  'SEEDS OF PROSPERITY',
  '[CLICK TO CONTINUE]',
  '▼',
  '▌',
  '⏸ PAUSE',
];

// Cadence of the original: a 30 ms typewriter (one extra tick before "typing" ends), then a 2.5 s hold.
const TYPE_INTERVAL = 0.03;
const HOLD = 2.5;
const lineDuration = (text: string) => (text.length + 1) * TYPE_INTERVAL + HOLD;
const TOTAL = LINES.reduce((sum, l) => sum + lineDuration(l.text), 0);
/** Seconds at which the given scene starts playing. */
const sceneStart = (scene: string) => {
  let t = 0;
  for (const s of SCENE_ORDER) {
    if (s === scene) return t;
    for (const l of SCRIPT[s]) t += lineDuration(l.text);
  }
  throw new Error(`unknown scene ${scene}`);
};

const W = 960;
/** Open sky, far from the toggle button. */
const SKY = { x: 480, y: 100 };
/** Inside the ⏸ PAUSE / ▶ AUTO button, which hugs the bottom-right corner with a 16 px margin. */
const toggleAt = (width: number) => ({ x: width - 26, y: LOGICAL_HEIGHT - 26 });

const run = (opts: RunOptions) => runProgram(createFarmingGame, opts);
const texts = (r: ReturnType<typeof run>) => r.lastTexts.map(t => t.text);

/**
 * The dialogue word-wraps, so a long script line is drawn as several text() calls. A line counts as
 * seen when it is drawn whole, or when consecutive drawn segments split at spaces join back into it.
 */
function coveredBy(seen: Set<string>, line: string): boolean {
  const words = line.split(' ');
  const memo = new Map<number, boolean>();
  const from = (i: number): boolean => {
    if (i === words.length) return true;
    if (memo.has(i)) return memo.get(i)!;
    let ok = false;
    for (let j = words.length; j > i && !ok; j--) if (seen.has(words.slice(i, j).join(' '))) ok = from(j);
    memo.set(i, ok);
    return ok;
  };
  return from(0);
}

describe('farming: the whole narrative', () => {
  const full = run({ seconds: TOTAL + 2 });

  it('runs for its real duration without errors', () => {
    expect(TOTAL).toBeCloseTo(99.75, 2);
    expect(full.errors).toEqual([]);
    expect(full.frames).toBe(Math.round((TOTAL + 2) * 60));
  });

  it('draws every line of the script and every speaker', () => {
    for (const line of LINES) {
      expect(coveredBy(full.textsSeen, line.text), `missing "${line.text}"`).toBe(true);
    }
    for (const speaker of new Set(LINES.map(l => l.speaker))) {
      expect(full.textsSeen.has(`[${speaker}]`), `missing speaker [${speaker}]`).toBe(true);
    }
  });

  it('draws the whole HUD vocabulary', () => {
    for (const s of HUD_TEXT) expect(full.textsSeen.has(s), `missing HUD text "${s}"`).toBe(true);
  });

  it('opens no links', () => {
    expect(full.opened).toEqual([]);
  });

  it('loops back to the first scene after the last line', () => {
    // 2 s into the second cycle the first line has been fully typed and the status panel is reset.
    const seen = texts(full);
    expect(seen).toContain('[NARRATOR]');
    expect(seen).toContain('NAKURU COUNTY, KENYA...');
    expect(seen).toContain('💳 Credit: NONE');
    expect(seen).toContain('📈 Yield vs Traditional: --');
  });

  it('plays the scenes in order with the status panel following along', () => {
    const expected: Record<string, { credit: string; yld: string; sprite: number | null }> = {
      intro: { credit: 'NONE', yld: '--', sprite: null },
      loan_offer: { credit: 'NONE', yld: '--', sprite: null },
      planting: { credit: 'ACTIVE', yld: '--', sprite: 8 },
      growing: { credit: 'ACTIVE', yld: 'More...', sprite: 15 },
      harvest: { credit: 'ACTIVE', yld: 'A lot...', sprite: 30 },
      success: { credit: 'REPAID', yld: 'A lot...', sprite: 30 },
    };
    for (const scene of SCENE_ORDER) {
      const r = run({ seconds: sceneStart(scene) + 1 });
      expect(r.errors).toEqual([]);
      const seen = texts(r);
      const first = SCRIPT[scene][0];
      expect(seen, scene).toContain(`[${first.speaker}]`);
      expect(seen, scene).toContain(`💳 Credit: ${expected[scene].credit}`);
      expect(seen, scene).toContain(`📈 Yield vs Traditional: ${expected[scene].yld}`);
      // The field: 10 crops at 8 logical px per art pixel on layer 1, growing with the story.
      const crops = r.painter.sprites.filter(s => s.layer === 1);
      if (expected[scene].sprite === null) expect(crops, scene).toHaveLength(0);
      else {
        expect(crops, scene).toHaveLength(10);
        for (const c of crops) {
          expect(c.scale).toBe(8);
          expect(c.sprite.rows).toHaveLength(expected[scene].sprite!);
        }
      }
    }
  });
});

describe('farming: typewriter cadence', () => {
  it('reveals one character every 30 ms with a pulsing cursor', () => {
    const r = run({ seconds: 0.5 });
    expect(r.errors).toEqual([]);
    const seen = texts(r);
    expect(seen).toContain('NAKURU COUNTY, K'); // floor(0.5 / 0.03) = 16 characters
    expect(seen).toContain('▌');
    expect(seen).not.toContain('[CLICK TO CONTINUE]');
    expect(seen).not.toContain('▼');
  });

  it('shows the completed line, the click hint and the next arrow once typing ends', () => {
    const r = run({ seconds: 1 });
    const seen = texts(r);
    expect(seen).toContain('NAKURU COUNTY, KENYA...');
    expect(seen).toContain('[CLICK TO CONTINUE]');
    expect(seen).toContain('▼');
    expect(seen).not.toContain('▌');
  });

  it('holds 2.5 s after typing before auto-advancing', () => {
    const d = lineDuration(LINES[0].text);
    expect(texts(run({ seconds: d - 0.2 }))).toContain('[NARRATOR]');
    expect(texts(run({ seconds: d - 0.2 }))).not.toContain('[WANJIKU]');
    expect(texts(run({ seconds: d + 0.2 }))).toContain('[WANJIKU]');
  });

  it('never shows a dangling surrogate half while typing an emoji', () => {
    const r = run({ seconds: sceneStart('planting') + lineDuration(SCRIPT.planting[0].text) + 1 });
    for (const s of r.textsSeen) {
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff) expect(i + 1, `lone high surrogate in "${s}"`).toBeLessThan(s.length);
      }
    }
  });

  it('hides the next arrow on the final line, which has showNext: false', () => {
    const last = LINES[LINES.length - 1];
    const r = run({ seconds: TOTAL - HOLD + 0.5 }); // the last line is fully typed and holding
    const seen = texts(r);
    expect(coveredBy(new Set(seen), last.text)).toBe(true);
    expect(seen).toContain('[CLICK TO CONTINUE]');
    expect(seen).not.toContain('▼');
  });
});

describe('farming: interactions', () => {
  it('a click while typing completes the line', () => {
    const r = run({ seconds: 0.5, clicks: [{ at: 0.2, ...SKY }] });
    expect(r.errors).toEqual([]);
    const seen = texts(r);
    expect(seen).toContain('NAKURU COUNTY, KENYA...');
    expect(seen).toContain('[CLICK TO CONTINUE]');
    expect(seen).not.toContain('▌');
  });

  it('a click after typing advances exactly one line', () => {
    const r = run({ seconds: 0.6, clicks: [{ at: 0.2, ...SKY }, { at: 0.4, ...SKY }] });
    const seen = texts(r);
    expect(seen).toContain('[WANJIKU]');
    expect(seen).toContain('▌');
    // Only 12 frames of typing into line 2 - it cannot have reached line 3.
    expect(r.textsSeen.has('How will I afford quality seeds AND fertilizer?')).toBe(false);
  });

  it('clicks can walk through the entire story and wrap around', () => {
    const clicks = LINES.flatMap((_, i) => [{ at: 0.1 + i * 0.2, ...SKY }, { at: 0.2 + i * 0.2, ...SKY }]);
    const r = run({ seconds: 0.2 + LINES.length * 0.2 + 0.5, clicks });
    expect(r.errors).toEqual([]);
    for (const line of LINES) expect(coveredBy(r.textsSeen, line.text), `missing "${line.text}"`).toBe(true);
    expect(texts(r)).toContain('[NARRATOR]');
    expect(texts(r)).toContain('💳 Credit: NONE');
  });

  it('the ⏸ PAUSE toggle stops auto-advance without completing or advancing the line', () => {
    const short = run({ seconds: 0.5, clicks: [{ at: 0.1, ...toggleAt(W) }] });
    expect(texts(short)).toContain('▶ AUTO');
    expect(short.textsSeen.has('NAKURU COUNTY, KENYA...')).toBe(false);
    expect(short.textsSeen.has('[WANJIKU]')).toBe(false);

    const long = run({ seconds: 10, clicks: [{ at: 0.1, ...toggleAt(W) }] });
    expect(long.errors).toEqual([]);
    expect(texts(long)).toContain('▶ AUTO');
    expect(texts(long)).toContain('[NARRATOR]');
    expect(texts(long)).toContain('NAKURU COUNTY, KENYA...');
    expect(long.textsSeen.has('[WANJIKU]')).toBe(false);
  });

  it('clicking elsewhere still advances while paused', () => {
    const r = run({ seconds: 1.5, clicks: [{ at: 0.1, ...toggleAt(W) }, { at: 1.0, ...SKY }] });
    expect(texts(r)).toContain('▶ AUTO');
    expect(texts(r)).toContain('[WANJIKU]');
  });

  it('▶ AUTO resumes with a fresh 2.5 s hold', () => {
    const clicks = [{ at: 0.1, ...toggleAt(W) }, { at: 5.0, ...toggleAt(W) }];
    const before = run({ seconds: 7.4, clicks });
    expect(texts(before)).toContain('⏸ PAUSE');
    expect(before.textsSeen.has('[WANJIKU]')).toBe(false);
    const after = run({ seconds: 7.6, clicks });
    expect(texts(after)).toContain('[WANJIKU]');
  });

  it('hit-tests the toggle at every width', () => {
    for (const width of [700, 1300]) {
      const r = run({ seconds: 0.5, width, clicks: [{ at: 0.1, ...toggleAt(width) }] });
      expect(texts(r), `width ${width}`).toContain('▶ AUTO');
    }
  });
});

describe('farming: portraits', () => {
  const portraitAt = (seconds: number) => {
    const r = run({ seconds });
    const portraits = r.painter.sprites.filter(s => s.layer === 2);
    return { r, portraits };
  };

  it('shows no portrait for the narrator', () => {
    expect(portraitAt(1).portraits).toHaveLength(0);
  });

  it('shows a neutral farmer for a plain statement', () => {
    const { portraits } = portraitAt(sceneStart('intro') + lineDuration(LINES[0].text) + 1);
    expect(portraits).toHaveLength(1);
    expect(portraits[0].scale).toBe(6);
    expect(portraits[0].sprite.rows).toHaveLength(16);
    expect(portraits[0].sprite.rows[6]).toBe('...SSMMSS...');
    expect(portraits[0].sprite.palette.M).toBe('#7C2D12');
    expect(portraits[0].sprite.palette.T).toBe('#F59E0B');
    expect(portraits[0].sprite.palette.P).toBe('#7C3AED');
  });

  it('shows a thinking farmer for a question', () => {
    const t = sceneStart('intro') + lineDuration(LINES[0].text) + lineDuration(LINES[1].text) + 1;
    const { portraits } = portraitAt(t);
    expect(portraits).toHaveLength(1);
    expect(portraits[0].sprite.rows[6]).toBe('...SSSMSS...');
  });

  it('shows a happy agent in Apollo green for an exclamation', () => {
    const { portraits } = portraitAt(sceneStart('loan_offer') + 1);
    expect(portraits).toHaveLength(1);
    expect(portraits[0].sprite.rows[6]).toBe('...SSMMSS...');
    expect(portraits[0].sprite.palette.M).toBe('#DC2626');
    expect(portraits[0].sprite.palette.T).toBe('#4ADE80');
    expect(portraits[0].sprite.palette.P).toBe('#1F2937');
  });
});

describe('farming: layout', () => {
  const samples = [0.3, 2, 12, 35, 60, 85, TOTAL - 0.5, TOTAL + 1];

  for (const width of [700, 1300]) {
    it(`keeps every text inside the ${width}-wide frame and on the HUD layer`, () => {
      for (const seconds of samples) {
        const r = run({ seconds, width });
        expect(r.errors, `t=${seconds}`).toEqual([]);
        expect(r.lastTexts.length, `t=${seconds}`).toBeGreaterThan(0);
        for (const t of r.lastTexts) {
          expect(t.x, `"${t.text}" x at t=${seconds}`).toBeGreaterThanOrEqual(0);
          expect(t.x, `"${t.text}" x at t=${seconds}`).toBeLessThanOrEqual(width);
          expect(t.y, `"${t.text}" y at t=${seconds}`).toBeGreaterThanOrEqual(0);
          expect(t.y, `"${t.text}" y at t=${seconds}`).toBeLessThanOrEqual(LOGICAL_HEIGHT);
          expect(t.layer, `"${t.text}" layer at t=${seconds}`).toBe(2);
        }
      }
    });
  }

  it('keeps the portrait clear of the status panel at the narrowest width', () => {
    // Line 2 of the intro wraps onto two lines and has a WANJIKU portrait.
    const r = run({ seconds: lineDuration(LINES[0].text) + 1, width: 700 });
    const panel = r.lastTexts.filter(t => t.text.startsWith('📈'));
    expect(panel).toHaveLength(1);
    const portrait = r.painter.sprites.find(s => s.layer === 2)!;
    expect(portrait).toBeDefined();
    // The portrait frame is 16 px (4 border + 12 padding) above the sprite; the panel row is 22 px tall plus 14 px of padding and border.
    expect(portrait.y - 16).toBeGreaterThan(panel[0].y + 22 + 14);
  });
});

// ---------------------------------------------------------------------------
// Hover states: `hover:border-slate-400 transition-colors` on the dialogue box and
// `hover:bg-slate-700 transition-colors` on the toggle, both 150 ms. The toggle's rest
// fill is bg-slate-800/90 while the hover fill has no opacity modifier, so its alpha
// goes 0.9 -> 1 as well.
// ---------------------------------------------------------------------------

interface BoxRecord { x: number; y: number; w: number; h: number; style: BoxStyle }

/** Records every box with its style so the hover colours can be read back. */
class StylePainter extends RecordingPainter {
  readonly boxes: BoxRecord[] = [];
  beginFrame(frame: number, time?: number): void {
    super.beginFrame(frame, time);
    this.boxes.length = 0;
  }
  box(x: number, y: number, w: number, h: number, style: BoxStyle): void {
    super.box(x, y, w, h, style);
    this.boxes.push({ x, y, w, h, style });
  }
}

const FPS = 60;
const HOVER_TRANSITION = 0.15;
/** One frame of latency: hover hit-tests the rects laid out by the previous draw. */
const HOVER_FRAMES = Math.round(HOVER_TRANSITION * FPS) + 1;
const AWAY = { x: -1, y: -1 };
const SPEAKER_LABELS = new Set(LINES.map(l => `[${l.speaker}]`));

/** Drives the game with a pointer that hovers but never clicks; returns the painter holding the final frame. */
function hoverRun(width: number, frames: number, pointerAt: (frame: number) => { x: number; y: number }): StylePainter {
  const painter = new StylePainter(width, LOGICAL_HEIGHT);
  const program = createFarmingGame({ openUrl: () => {} });
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    const { x, y } = pointerAt(i);
    const input: Input = {
      pointer: { x, y, down: false, justPressed: false, justReleased: false, inside: x >= 0 && y >= 0 && x <= width && y <= LOGICAL_HEIGHT },
      keysJustPressed: new Set(),
      keysDown: new Set(),
    };
    program.update(1 / FPS, input, t);
    painter.beginFrame(i, t);
    program.draw(painter);
  }
  return painter;
}

const contains = (b: BoxRecord, x: number, y: number) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
const channel = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16);

/** The dialogue box's border: the one stroked box drawn around the speaker label. */
function dialogueBorder(p: StylePainter): BoxRecord {
  const label = p.texts.find(t => SPEAKER_LABELS.has(t.text));
  expect(label).toBeDefined();
  const hits = p.boxes.filter(b => b.style.stroke !== undefined && contains(b, label!.x, label!.y));
  expect(hits).toHaveLength(1);
  return hits[0];
}

/** The toggle's fill: the topmost filled box under the ⏸ PAUSE / ▶ AUTO label. */
function toggleFill(p: StylePainter): BoxRecord {
  const label = p.texts.find(t => t.text === '⏸ PAUSE' || t.text === '▶ AUTO');
  expect(label).toBeDefined();
  const hits = p.boxes.filter(b => b.style.fill !== undefined && contains(b, label!.x, label!.y));
  expect(hits.length).toBeGreaterThan(0);
  return hits[hits.length - 1];
}

const centre = (b: { x: number; y: number; w: number; h: number }) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

describe('farming: hover states', () => {
  it('draws the resting colours when nothing is hovered', () => {
    const p = hoverRun(W, HOVER_FRAMES, () => AWAY);
    expect(dialogueBorder(p).style.stroke).toBe('#64748b');
    const fill = toggleFill(p);
    expect(fill.style.fill).toBe('#1e293b');
    expect(fill.style.alpha).toBeCloseTo(0.9);
  });

  it('tweens the toggle fill from slate-800/90 to slate-700 over 150 ms while hovered', () => {
    const midway = toggleFill(hoverRun(W, 3, () => toggleAt(W)));
    expect(midway.style.fill).not.toBe('#1e293b');
    expect(midway.style.fill).not.toBe('#334155');
    expect(channel(midway.style.fill!, 0)).toBeGreaterThan(0x1e);
    expect(channel(midway.style.fill!, 0)).toBeLessThan(0x33);
    expect(midway.style.alpha).toBeGreaterThan(0.9);
    expect(midway.style.alpha).toBeLessThan(1);

    const done = hoverRun(W, HOVER_FRAMES, () => toggleAt(W));
    const fill = toggleFill(done);
    expect(fill.style.fill).toBe('#334155');
    expect(fill.style.alpha).toBeCloseTo(1);
    // Hovering the toggle does not hover the dialogue underneath it.
    expect(dialogueBorder(done).style.stroke).toBe('#64748b');
  });

  it('tweens the dialogue border from slate-500 to slate-400 over 150 ms while hovered', () => {
    const idle = hoverRun(W, 1, () => AWAY);
    const over = centre(dialogueBorder(idle));

    const midway = dialogueBorder(hoverRun(W, 4, () => over));
    expect(midway.style.stroke).not.toBe('#64748b');
    expect(midway.style.stroke).not.toBe('#94a3b8');
    expect(channel(midway.style.stroke!, 0)).toBeGreaterThan(0x64);
    expect(channel(midway.style.stroke!, 0)).toBeLessThan(0x94);

    const done = hoverRun(W, HOVER_FRAMES, () => over);
    expect(dialogueBorder(done).style.stroke).toBe('#94a3b8');
    // Hovering the dialogue does not hover the toggle.
    expect(toggleFill(done).style.fill).toBe('#1e293b');
  });

  it('relaxes back to the resting colours 150 ms after the pointer leaves', () => {
    const hovered = 18;
    const gone = hoverRun(W, hovered + HOVER_FRAMES, i => (i < hovered ? toggleAt(W) : AWAY));
    const fill = toggleFill(gone);
    expect(fill.style.fill).toBe('#1e293b');
    expect(fill.style.alpha).toBeCloseTo(0.9);

    const partway = toggleFill(hoverRun(W, hovered + 3, i => (i < hovered ? toggleAt(W) : AWAY)));
    expect(partway.style.fill).not.toBe('#1e293b');
    expect(partway.style.fill).not.toBe('#334155');
  });

  it('gives the toggle the hover where it overlaps the dialogue at the narrowest width, like the DOM z-order', () => {
    const idle = hoverRun(700, 1, () => AWAY);
    const toggle = toggleFill(idle);
    const dialogue = dialogueBorder(idle);
    const x0 = Math.max(toggle.x, dialogue.x);
    const x1 = Math.min(toggle.x + toggle.w, dialogue.x + dialogue.w);
    const y0 = Math.max(toggle.y, dialogue.y);
    const y1 = Math.min(toggle.y + toggle.h, dialogue.y + dialogue.h);
    expect(x1).toBeGreaterThan(x0);
    expect(y1).toBeGreaterThan(y0);
    const overlap = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };

    const p = hoverRun(700, HOVER_FRAMES, () => overlap);
    expect(toggleFill(p).style.fill).toBe('#334155');
    expect(dialogueBorder(p).style.stroke).toBe('#64748b');
  });

  it('a hovering pointer never throws and the hovered toggle still hit-tests at every width', () => {
    for (const width of [700, W, 1300]) {
      const r = run({ seconds: 1, width, pointer: () => toggleAt(width), clicks: [{ at: 0.5, ...toggleAt(width) }] });
      expect(r.errors, `width ${width}`).toEqual([]);
      expect(texts(r), `width ${width}`).toContain('▶ AUTO');
    }
  });

  it('a click on the hovered dialogue still advances', () => {
    const over = centre(dialogueBorder(hoverRun(W, 1, () => AWAY)));
    const r = run({ seconds: 0.6, pointer: () => over, clicks: [{ at: 0.2, ...over }, { at: 0.4, ...over }] });
    expect(r.errors).toEqual([]);
    expect(texts(r)).toContain('[WANJIKU]');
  });
});
