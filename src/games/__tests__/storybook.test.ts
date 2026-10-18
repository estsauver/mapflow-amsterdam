import { describe, it, expect } from 'vitest';
import { runProgram, type RunOptions, type RunResult } from '@/lib/console/runProgram';
import { createStorybookGame } from '../storybook';

// ---------------------------------------------------------------------------
// The script, copied verbatim from src/components/StorybookGame.tsx.
// ---------------------------------------------------------------------------
const REQUESTS = [
  {
    childName: 'Emma',
    request: 'I want a book about a dinosaur construction worker!',
    bookTitle: 'Dino Builds a House',
    storyPreview: 'Terry the T-Rex loved building things...',
  },
  {
    childName: 'Marcus',
    request: 'Can I have a story about a princess who flies rockets?',
    bookTitle: 'Princess Starlight',
    storyPreview: 'Princess Nova dreamed of the stars...',
  },
  {
    childName: 'Sofia',
    request: 'I want a book about a bunny who bakes cookies!',
    bookTitle: 'Benny\'s Bakery',
    storyPreview: 'In a cozy burrow, Benny mixed the dough...',
  },
] as const;

const PHASE_TEXTS = ['Preparing blank pages...', 'Writing story...', 'Creating illustrations...', 'Binding book...'];

const SCRIPT: string[] = [
  'The Story Machine',
  '"Tell me what book you\'d like, and I\'ll create it!"',
  'LIBR-4R1',
  ...PHASE_TEXTS,
  'Books Created: 1',
  'Books Created: 2',
  'Books Created: 3',
  'Every child\'s imagination deserves a story.',
  'PROJECT UNNAMED',
  'More stories coming soon...',
  'Next request incoming...',
  ...REQUESTS.flatMap(r => [
    r.childName,
    `"${r.request}"`,
    r.bookTitle,
    `"${r.storyPreview}"`,
    `"Here you go, ${r.childName}!"`,
  ]),
];

// ---------------------------------------------------------------------------
// The original's timers (seconds).
// ---------------------------------------------------------------------------
const LIBRARY = 2.5; // setTimeout(() => setScene('request'), 2500)
const TYPE_TICK = 0.05; // setInterval(..., 50): tick k shows request.slice(0, k - 1)
const REQUEST_HOLD = 1.5; // setTimeout(() => setScene('creating'), 1500) after the final tick
const CREATING = 4.5; // 4 phases × 800 ms, a fifth tick clears, then 500 ms
const REVEAL = 3; // setTimeout(..., 3000)
const COMPLETE = 2.5; // setTimeout(..., 2500)
const requestSeconds = (request: string) => (request.length + 2) * TYPE_TICK + REQUEST_HOLD;

/** Scene start times for the first request, then the full-narrative length. */
const t0 = LIBRARY; // Emma's request starts
const t1 = t0 + requestSeconds(REQUESTS[0].request); // creating
const t2 = t1 + CREATING; // reveal
const t3 = t2 + REVEAL; // complete
const t4 = t3 + COMPLETE; // Marcus's request
const FULL =
  LIBRARY +
  REQUESTS.reduce((acc, r, i) => acc + requestSeconds(r.request) + CREATING + REVEAL + (i < REQUESTS.length - 1 ? COMPLETE : 0), 0);

const run = (seconds: number, extra: Partial<RunOptions> = {}): RunResult =>
  runProgram(createStorybookGame, { seconds, fps: 60, ...extra });
const textsAt = (seconds: number, width = 960): string[] => run(seconds, { width }).lastTexts.map(t => t.text);

/**
 * True when `target` was drawn, either as one text() call or word-wrapped into
 * consecutive lines (speech bubbles wrap inside max-w-md).
 */
function sawLine(seen: Iterable<string>, target: string): boolean {
  const set = seen instanceof Set ? seen : new Set(seen);
  if (set.has(target)) return true;
  const tryFrom = (rest: string): boolean => {
    if (rest === '') return true;
    for (const s of set) {
      if (s && rest.startsWith(s) && (rest.length === s.length || rest[s.length] === ' ')) {
        if (tryFrom(rest.slice(s.length + 1))) return true;
      }
    }
    return false;
  };
  return tryFrom(target);
}

describe('storybook: full narrative', () => {
  const full = run(FULL + 3);

  it('plays all three books without errors and ends on the final complete scene', () => {
    expect(full.errors).toEqual([]);
    expect(FULL).toBeCloseTo(42.35, 5);
    const last = full.lastTexts.map(t => t.text);
    expect(last).toContain('Books Created: 3');
    expect(last).toContain('PROJECT UNNAMED');
    expect(last).toContain('More stories coming soon...');
    expect(last).toContain('Every child\'s imagination deserves a story.');
    expect(last).not.toContain('Next request incoming...');
  });

  it('draws every line of the original script', () => {
    for (const s of SCRIPT) expect(sawLine(full.textsSeen, s), `missing: ${s}`).toBe(true);
  });

  it('stays on the complete scene instead of looping', () => {
    const later = run(FULL + 12);
    expect(later.errors).toEqual([]);
    const last = later.lastTexts.map(t => t.text);
    expect(last).toContain('Books Created: 3');
    expect(last).toContain('PROJECT UNNAMED');
    for (const r of REQUESTS) expect(last).not.toContain(r.childName);
  });

  it('never opens a link (the original has none)', () => {
    expect(full.opened).toEqual([]);
  });

  it('draws the illustrations as vector paths', () => {
    expect(full.painter.counts.path).toBeGreaterThan(0);
  });
});

describe('storybook: scene order and cadence', () => {
  it('opens on the library with the robot and its welcome bubble', () => {
    const texts = textsAt(1);
    expect(texts).toContain('The Story Machine');
    expect(texts).toContain('"Tell me what book you\'d like, and I\'ll create it!"');
    expect(texts).toContain('LIBR-4R1');
  });

  it('switches to the first request after 2.5 s', () => {
    const texts = textsAt(t0 + 0.3);
    expect(texts).toContain('Emma');
    expect(texts).toContain('|');
    expect(texts).not.toContain('The Story Machine');
  });

  it('types the request one character per 50 ms tick', () => {
    // 20 ticks (1.0 s) into the scene the original shows the first 19 characters.
    const texts = textsAt(t0 + 1.03);
    expect(texts).toContain(`"${REQUESTS[0].request.slice(0, 19)}"`);
    // ...and every prefix appears on the way to the complete line.
    const r = run(t1);
    const req = REQUESTS[0].request;
    for (let k = 1; k <= req.length; k++) expect(sawLine(r.textsSeen, `"${req.slice(0, k)}"`), `prefix ${k}`).toBe(true);
  });

  it('runs the four creating phases on an 800 ms cadence', () => {
    const none = textsAt(t1 + 0.4);
    for (const s of PHASE_TEXTS) expect(none).not.toContain(s);
    expect(textsAt(t1 + 0.9)).toContain('Preparing blank pages...');
    expect(textsAt(t1 + 1.7)).toContain('Writing story...');
    expect(textsAt(t1 + 2.5)).toContain('Creating illustrations...');
    expect(textsAt(t1 + 3.3)).toContain('Binding book...');
    expect(textsAt(t1 + 4.3)).toContain('Binding book...');
  });

  it('reveals the book with its title, preview and the robot\'s line', () => {
    const texts = textsAt(t2 + 0.5);
    expect(texts).toContain('Dino Builds a House');
    expect(sawLine(texts, '"Terry the T-Rex loved building things..."')).toBe(true);
    expect(texts).toContain('"Here you go, Emma!"');
  });

  it('counts the book and announces the next request', () => {
    const texts = textsAt(t3 + 0.5);
    expect(texts).toContain('Books Created: 1');
    expect(texts).toContain('Next request incoming...');
    expect(texts).toContain('LIBR-4R1');
    expect(texts).not.toContain('PROJECT UNNAMED');
  });

  it('moves on to Marcus after 2.5 s', () => {
    expect(textsAt(t4 + 0.3)).toContain('Marcus');
  });

  it('changes scene within 0.1 s of each of the original timers', () => {
    const tSofiaReveal = FULL - REVEAL; // the last reveal, which ends the narrative
    const boundaries: Array<[at: number, before: string, after: string]> = [
      [t0, 'The Story Machine', 'Emma'],
      [t1, `"${REQUESTS[0].request}"`, 'Preparing blank pages...'],
      [t2, 'Binding book...', 'Dino Builds a House'],
      [t3, 'Dino Builds a House', 'Books Created: 1'],
      [t4, 'Books Created: 1', 'Marcus'],
      [tSofiaReveal, 'Binding book...', 'Benny\'s Bakery'],
      [FULL, '"Here you go, Sofia!"', 'Books Created: 3'],
    ];
    for (const [at, before, after] of boundaries) {
      // The creating scene shows no caption until its first 800 ms phase, so look 0.9 s in for that one.
      const afterAt = after === 'Preparing blank pages...' ? at + 0.9 : at + 0.1;
      const pre = textsAt(at - 0.1);
      const post = textsAt(afterAt);
      expect(sawLine(pre, before), `${before} should still show at ${(at - 0.1).toFixed(2)}s`).toBe(true);
      expect(sawLine(pre, after), `${after} should not show yet at ${(at - 0.1).toFixed(2)}s`).toBe(false);
      expect(sawLine(post, after), `${after} should show at ${afterAt.toFixed(2)}s`).toBe(true);
      expect(sawLine(post, before), `${before} should be gone at ${afterAt.toFixed(2)}s`).toBe(false);
    }
  });
});

describe('storybook: interactions', () => {
  it('has no clickable controls: clicks and keys leave the narrative untouched', () => {
    const clicks = Array.from({ length: 24 }, (_, i) => ({ at: i * 0.5 + 0.1, x: 480, y: 270 }));
    const keys = [{ at: 1, key: ' ' }, { at: 5, key: 'Enter' }, { at: 9, key: 'p' }];
    const plain = run(t3 + 0.5);
    const poked = run(t3 + 0.5, { clicks, keys });
    expect(poked.errors).toEqual([]);
    expect(poked.opened).toEqual([]);
    expect(poked.lastTexts.map(t => t.text)).toEqual(plain.lastTexts.map(t => t.text));
  });

  it('scales the revealed book up while the pointer hovers it', () => {
    const title = (r: RunResult) => r.lastTexts.find(t => t.text === 'Dino Builds a House');
    const plain = run(t2 + 1.5);
    const hovered = run(t2 + 1.5, { pointer: () => ({ x: 480, y: 200 }) });
    expect(hovered.errors).toEqual([]);
    expect(title(plain)).toBeDefined();
    expect(title(hovered)).toBeDefined();
    // The title sits below the book's centre, so a 1.05× scale about the centre pushes it down.
    expect(title(hovered)!.y).toBeGreaterThan(title(plain)!.y + 1);
    // Without the pointer the two runs are identical.
    const again = run(t2 + 1.5);
    expect(again.lastTexts).toEqual(plain.lastTexts);
  });
});

describe('storybook: the robot scenes lay out from the body like the DOM', () => {
  it('puts the library bubble mt-8 below the robot body, not below the label\'s overhang', () => {
    // The DOM robot's layout box is its 128×160 body (antenna, arms and label are absolute), so
    // `mt-8` on the bubble starts 32 px under the body. Measured between glyph tops:
    //   label: text-xs centred in a 24 px box whose bottom overhangs the body by 8 → body bottom − 11
    //   title: py-4 then a text-2xl line box → body bottom + 32 + 16 + (32 − 24) / 2 = body bottom + 52
    const texts = run(1).lastTexts;
    const label = texts.find(t => t.text === 'LIBR-4R1');
    const title = texts.find(t => t.text === 'The Story Machine');
    expect(label).toBeDefined();
    expect(title).toBeDefined();
    expect(title!.y - label!.y).toBeCloseTo(63, 5);
  });
});

describe('storybook: the final scene stays above the shelf', () => {
  const SHELF_TOP = 540 - 128;
  // TextRecord has no size, so the unscaled sizes (text-sm 16, text-xs 14) bound the glyph's
  // bottom from above: the scene may only ever scale its column down to fit.
  const LINES: Array<[text: string, size: number]> = [
    ['PROJECT UNNAMED', 16],
    ['More stories coming soon...', 14],
  ];
  for (const width of [700, 1300]) {
    it(`keeps PROJECT UNNAMED and the closing line off the amber-900 shelf at ${width} wide`, () => {
      const r = run(FULL + 1, { width });
      expect(r.errors).toEqual([]);
      for (const [text, size] of LINES) {
        const rec = r.lastTexts.find(t => t.text === text);
        expect(rec, `${text} drawn`).toBeDefined();
        expect(rec!.y + size, `${text} bottom`).toBeLessThanOrEqual(SHELF_TOP);
      }
    });
  }

  it('still draws the library, request and creating scenes at full size', () => {
    // Only the final column is taller than the space above the shelf; nothing else shrinks.
    // The robot's label sits 149 px under its body top at scale 1, so the label-to-count gap in a
    // non-final complete scene is fixed: count glyph = body + 160 + 32 + 64 + 8 + (32 − 24) / 2 = body + 268.
    const texts = run(t3 + 0.5).lastTexts;
    const label = texts.find(t => t.text === 'LIBR-4R1');
    const count = texts.find(t => t.text === 'Books Created: 1');
    expect(label).toBeDefined();
    expect(count).toBeDefined();
    expect(count!.y - label!.y).toBeCloseTo(268 - 149, 5);
  });
});

describe('storybook: layout at 700 and 1300 wide', () => {
  const moments = [1, t0 + 2, t1 + 2, t1 + 3.5, t2 + 1, t3 + 1, FULL + 1];
  for (const width of [700, 1300]) {
    it(`keeps every text inside the ${width}×540 frame in every scene`, () => {
      for (const seconds of moments) {
        const r = run(seconds, { width });
        expect(r.errors, `errors at ${seconds}s`).toEqual([]);
        expect(r.lastTexts.length, `no text at ${seconds}s`).toBeGreaterThan(0);
        for (const rec of r.lastTexts) {
          expect(rec.x, `${rec.text} x at ${seconds}s`).toBeGreaterThanOrEqual(0);
          expect(rec.x, `${rec.text} x at ${seconds}s`).toBeLessThanOrEqual(width);
          expect(rec.y, `${rec.text} y at ${seconds}s`).toBeGreaterThanOrEqual(0);
          expect(rec.y, `${rec.text} y at ${seconds}s`).toBeLessThanOrEqual(540);
        }
      }
    });
  }
});
