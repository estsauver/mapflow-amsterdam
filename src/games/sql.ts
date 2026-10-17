/**
 * No, SQL — the SQL vs NoSQL battle for nocommasql.com, ported from the DOM
 * component (src/components/SqlGame.tsx) onto the console. Every string, the
 * scene order, the timing cadences and the palette follow that component; the
 * only state is time, so the narrative is deterministic.
 */
import type { GameFactory, Input, Painter, TextStyle } from '../lib/console/types';

type Scene = 'intro' | 'vs' | 'battle' | 'victory';
type Phase = 'myth' | 'typing' | 'defeated';

interface Challenge {
  myth: string;
  mythIcon: string;
  nosqlName: string;
  sql: string;
  explanation: string;
}

export const NOCOMMASQL_URL = 'https://nocommasql.com';

const INTRO_LINES = [
  '> LOADING NO, SQL...',
  '',
  '> "There is no NoSQL..."',
  '',
  '> "Only SQL you haven\'t learned yet."',
  '',
  '> PREPARE FOR BATTLE',
];

const CHALLENGES: Challenge[] = [
  {
    myth: 'You need MongoDB for JSON documents!',
    mythIcon: '🍃',
    nosqlName: 'MongoDB',
    sql: `SELECT data->>'name' AS name,
       data->>'email' AS email
FROM users
WHERE data @> '{"active": true}';`,
    explanation: 'PostgreSQL JSONB since 2014',
  },
  {
    myth: 'You need Redis for key-value storage!',
    mythIcon: '🔴',
    nosqlName: 'Redis',
    sql: `CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  value JSONB,
  expires_at TIMESTAMPTZ
);

-- With UPSERT support!
INSERT INTO cache VALUES (...)
ON CONFLICT (key) DO UPDATE...`,
    explanation: 'SQL handles KV just fine',
  },
  {
    myth: 'You need Neo4j for graph queries!',
    mythIcon: '🕸️',
    nosqlName: 'Neo4j',
    sql: `WITH RECURSIVE team AS (
  SELECT id, name, manager_id
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id
  FROM employees e
  JOIN team t ON e.manager_id = t.id
)
SELECT * FROM team;`,
    explanation: 'Recursive CTEs are powerful',
  },
  {
    myth: 'You need Elasticsearch for search!',
    mythIcon: '🔍',
    nosqlName: 'Elasticsearch',
    sql: `SELECT title, ts_rank(search, q) AS rank
FROM articles,
     to_tsquery('postgres & rocks') q
WHERE search @@ q
ORDER BY rank DESC;

-- With trigram fuzzy matching!
CREATE INDEX ON articles
  USING gin(title gin_trgm_ops);`,
    explanation: 'Full-text search built-in',
  },
];

// Timing in seconds, from the original component's intervals and timeouts.
const INTRO_STEP = 0.4; // one line per interval tick
const INTRO_HOLD = 1.0; // pause after the interval drains
const VS_DURATION = 2.5;
const VS_FLASH = 0.2; // colour strobe
const MYTH_DURATION = 2.0;
const TYPE_STEP = 0.025; // one character per tick
const TYPE_HOLD = 0.5; // pause after the last character
const DEFEATED_DURATION = 3.0;
const CARD_TRANSITION = 0.5; // challenger card fade/scale (transition-all duration-500)
const AMBIENT_TRANSITION = 1.0; // ambient glow colour (duration-1000)
const HOVER_TRANSITION = 0.15; // link button (transition-colors)

type Rgb = readonly [number, number, number];
type Rgba = readonly [number, number, number, number];

// Tailwind v3 palette.
const C = {
  slate950: '#020617',
  slate900: '#0f172a',
  slate700: '#334155',
  slate400: '#94a3b8',
  white: '#ffffff',
  cyan400: '#22d3ee',
  blue400: '#60a5fa',
  blue800: '#1e40af',
  red400: '#f87171',
  red500: '#ef4444',
  red800: '#991b1b',
  green400: '#4ade80',
  green500: '#22c55e',
  yellow400: '#facc15',
  yellow500: '#eab308',
};
const RED_950_50 = 'rgba(69, 10, 10, 0.5)';
const BLUE_950_50 = 'rgba(23, 37, 84, 0.5)';
const SLATE_900_80 = 'rgba(15, 23, 42, 0.8)';
const BLUE_600: Rgb = [37, 99, 235];
const BLUE_500: Rgb = [59, 130, 246];

/** Ambient radial glow per scene (the DOM's transition-colors overlay). */
const AMBIENT: Record<Scene, Rgba> = {
  intro: [6, 182, 212, 0.05],
  vs: [6, 182, 212, 0.05],
  battle: [234, 179, 8, 0.05],
  victory: [59, 130, 246, 0.1],
};

interface Rect { x: number; y: number; w: number; h: number }

const rgba = (c: Rgba) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
const mixRgb = (a: Rgb, b: Rgb, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;
const mixRgba = (a: Rgba, b: Rgba, t: number): Rgba => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
  a[3] + (b[3] - a[3]) * t,
];
/** Moves `value` toward `target` by at most `step`; a linear CSS transition. */
const approach = (value: number, target: number, step: number) =>
  value < target ? Math.min(target, value + step) : Math.max(target, value - step);
const contains = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** animate-pulse: opacity 1 ↔ 0.5 over 2 s. */
const pulse = (time: number) => 0.75 + 0.25 * Math.cos(Math.PI * time);
/** animate-bounce: a 1 s hop of a quarter of the element's height, ease-in up / ease-out down. */
const bounce = (time: number, height: number) => {
  const phase = time - Math.floor(time);
  if (phase < 0.5) {
    const u = phase / 0.5;
    return -0.25 * height * (1 - u * u);
  }
  const u = (phase - 0.5) / 0.5;
  return -0.25 * height * (1 - (1 - u) * (1 - u));
};
/** Top of a glyph box of `size` centred in a CSS line box of `lineHeight`. */
const lineY = (lineTop: number, lineHeight: number, size: number) => lineTop + (lineHeight - size) / 2;

export const createSqlGame: GameFactory = host => {
  let scene: Scene = 'intro';
  let phase: Phase = 'myth';
  let challenge = 0;
  /** Seconds into the current step (intro, vs, a battle phase, victory). */
  let stepT = 0;
  let clock = 0;
  /** 0 = challenger card at rest, 1 = defeated look (opacity 0.3, scale 0.95). */
  let cardFade = 0;
  let hover = 0;
  let ambientFrom: Rgba = AMBIENT.intro;
  let ambientTo: Rgba = AMBIENT.intro;
  let ambientT = 1;
  /** Where draw() last placed the victory link, for hit-testing in update(). */
  let linkRect: Rect | null = null;

  const current = () => CHALLENGES[challenge];
  const ambient = () => mixRgba(ambientFrom, ambientTo, Math.min(1, ambientT / AMBIENT_TRANSITION));

  const setScene = (next: Scene) => {
    if (next === scene) return;
    ambientFrom = ambient();
    ambientTo = AMBIENT[next];
    ambientT = 0;
    scene = next;
    stepT = 0;
  };

  const stepDuration = (): number => {
    switch (scene) {
      case 'intro':
        return INTRO_STEP * (INTRO_LINES.length + 1) + INTRO_HOLD;
      case 'vs':
        return VS_DURATION;
      case 'battle':
        if (phase === 'myth') return MYTH_DURATION;
        if (phase === 'typing') return (current().sql.length + 2) * TYPE_STEP + TYPE_HOLD;
        return DEFEATED_DURATION;
      case 'victory':
        return Infinity;
    }
  };

  const advance = () => {
    switch (scene) {
      case 'intro':
        setScene('vs');
        break;
      case 'vs':
        challenge = 0;
        phase = 'myth';
        setScene('battle');
        break;
      case 'battle':
        if (phase === 'myth') phase = 'typing';
        else if (phase === 'typing') phase = 'defeated';
        else if (challenge < CHALLENGES.length - 1) {
          challenge++;
          phase = 'myth';
        } else setScene('victory');
        break;
      case 'victory':
        break;
    }
  };

  /** Characters typed so far: the DOM interval showed slice(0, k - 1) on its k-th tick. */
  const typedChars = () => {
    const len = current().sql.length;
    return Math.max(0, Math.min(len, Math.floor(stepT / TYPE_STEP + 1e-9) - 1));
  };

  const update = (dt: number, input: Input) => {
    clock += dt;

    const pointer = input.pointer;
    const overLink = scene === 'victory' && linkRect !== null && pointer.inside && contains(linkRect, pointer.x, pointer.y);
    if (overLink && pointer.justPressed) host.openUrl(NOCOMMASQL_URL);
    hover = approach(hover, overLink ? 1 : 0, dt / HOVER_TRANSITION);

    stepT += dt;
    for (;;) {
      const duration = stepDuration();
      if (!(stepT >= duration)) break;
      const carry = stepT - duration;
      advance();
      stepT = carry;
    }

    cardFade = approach(cardFade, scene === 'battle' && phase === 'defeated' ? 1 : 0, dt / CARD_TRANSITION);
    ambientT += dt;
  };

  // ---------------------------------------------------------------- drawing

  const drawBackground = (p: Painter) => {
    p.clear(C.slate950, 0);
    p.layer(0);
    const a = ambient();
    p.gradient(0, 0, p.width, p.height, [[0, rgba(a)], [0.7, rgba([a[0], a[1], a[2], 0])]], 'radial');
    // Arcade cabinet edge: inset 0 0 100px rgba(0, 0, 0, 0.8).
    p.gradient(0, 0, p.width, p.height, [[0, 'rgba(0, 0, 0, 0)'], [0.65, 'rgba(0, 0, 0, 0)'], [1, 'rgba(0, 0, 0, 0.8)']], 'radial');
    p.layer(1);
  };

  const drawIntro = (p: Painter) => {
    const shown = Math.min(INTRO_LINES.length, Math.floor(stepT / INTRO_STEP + 1e-9));
    const lines = INTRO_LINES.slice(0, shown);
    const heights = lines.map(line => (line === '' ? 16 : 28)); // text-xl line box, h-4 spacer
    const total = heights.reduce((sum, h) => sum + h, 0);
    let y = (p.height - total) / 2;
    lines.forEach((line, i) => {
      if (line !== '') {
        const color = line.startsWith('>') ? C.cyan400 : C.white;
        p.text(line, p.width / 2, lineY(y, 28, 20), { size: 20, color, align: 'center', shadow: color });
      }
      y += heights[i];
    });
  };

  const drawVs = (p: Painter) => {
    const flash = Math.floor(stepT / VS_FLASH + 1e-9) % 2 === 1;
    const emoji: TextStyle = { size: 96, color: C.white, align: 'center' };
    const label = (color: string, shadow: string): TextStyle => ({ size: 36, color, weight: 'bold', align: 'center', shadow });
    const gap = 32;
    const sqlW = Math.max(p.measureText('🐘', emoji), p.measureText('SQL', { size: 36, weight: 'bold' }));
    const vsW = p.measureText('VS', { size: 60, weight: 'bold' });
    const noW = Math.max(p.measureText('👾', emoji), p.measureText('NoSQL', { size: 36, weight: 'bold' }));
    const columnH = 96 + 16 + 40; // emoji line box, mb-4, text-4xl line box
    const top = (p.height - columnH) / 2;
    const x0 = (p.width - (sqlW + gap + vsW + gap + noW)) / 2;

    const sqlX = x0 + sqlW / 2;
    p.text('🐘', sqlX, top, emoji);
    p.text('SQL', sqlX, lineY(top + 96 + 16, 40, 36), label(C.blue400, 'rgba(59, 130, 246, 0.8)'));

    const vsX = x0 + sqlW + gap + vsW / 2;
    p.text('VS', vsX, top + columnH / 2, {
      size: 60,
      weight: 'bold',
      align: 'center',
      baseline: 'middle',
      color: flash ? C.yellow400 : C.red500,
      shadow: flash ? 'rgba(250, 204, 21, 0.8)' : 'rgba(239, 68, 68, 0.8)',
    });

    const noX = x0 + sqlW + gap + vsW + gap + noW / 2;
    p.text('👾', noX, top, emoji);
    p.text('NoSQL', noX, lineY(top + 96 + 16, 40, 36), label(C.red400, 'rgba(248, 113, 113, 0.8)'));
  };

  const drawProgress = (p: Painter, pad: number) => {
    const segW = 32;
    const segH = 8;
    const segGap = 8;
    const n = CHALLENGES.length;
    const x0 = (p.width - (n * segW + (n - 1) * segGap)) / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (segW + segGap);
      if (i < challenge) p.box(x, pad, segW, segH, { fill: C.green500, radius: 4 });
      else if (i === challenge) p.box(x, pad, segW, segH, { fill: C.yellow500, radius: 4, alpha: pulse(clock) });
      else p.box(x, pad, segW, segH, { fill: C.slate700, radius: 4 });
    }
    return segH;
  };

  const drawChallenger = (p: Painter, r: Rect) => {
    const ch = current();
    // transition-all duration-500: opacity 1 → 0.3, scale 1 → 0.95 about the card centre.
    const s = 1 - 0.05 * cardFade;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const X = (v: number) => cx + (v - cx) * s;
    const Y = (v: number) => cy + (v - cy) * s;
    p.push();
    p.alpha(1 - 0.7 * cardFade);
    p.box(X(r.x), Y(r.y), r.w * s, r.h * s, { fill: RED_950_50, stroke: C.red800, lineWidth: 2 * s, radius: 8 * s });
    const ix = r.x + 2 + 16;
    const iy = r.y + 2 + 16;
    const iconW = p.measureText(ch.mythIcon, { size: 30 });
    p.text(ch.mythIcon, X(ix), Y(lineY(iy, 36, 30)), { size: 30 * s, color: C.white });
    p.text(`CHALLENGER: ${ch.nosqlName}`, X(ix + iconW + 12), Y(lineY(iy, 36, 16)), { size: 16 * s, color: C.red400 });
    p.text(`⚔️ "${ch.myth}"`, X(ix), Y(lineY(iy + 36 + 8, 28, 18)), {
      size: 18 * s,
      color: C.white,
      shadow: 'rgba(255, 255, 255, 0.3)',
    });
    p.pop();
  };

  const drawResponse = (p: Painter, r: Rect) => {
    const ch = current();
    p.box(r.x, r.y, r.w, r.h, { fill: BLUE_950_50, stroke: C.blue800, lineWidth: 2, radius: 8 });
    const ix = r.x + 2 + 16;
    const iy = r.y + 2 + 16;
    const iconW = p.measureText('🐘', { size: 30 });
    p.text('🐘', ix, lineY(iy, 36, 30), { size: 30, color: C.white });
    p.text('SQL RESPONDS:', ix + iconW + 12, lineY(iy, 36, 16), { size: 16, color: C.blue400 });

    const code: TextStyle = { size: 16, color: C.green400 };
    const lineH = 20;
    const codeTop = iy + 36 + 12;
    const typed = phase === 'typing' ? ch.sql.slice(0, typedChars()) : ch.sql;
    const lines = typed.split('\n');
    lines.forEach((line, i) => {
      if (line !== '') p.text(line, ix, lineY(codeTop + i * lineH, lineH, 16), code);
    });
    if (phase === 'typing') {
      const last = lines[lines.length - 1];
      const cursorX = ix + p.measureText(last, code);
      p.text('▊', cursorX, lineY(codeTop + (lines.length - 1) * lineH, lineH, 16), { ...code, alpha: pulse(clock) });
    }
    if (phase === 'defeated') {
      const codeBottom = codeTop + ch.sql.split('\n').length * lineH;
      const ruleY = codeBottom + 16; // mt-4, then border-t, then pt-4
      p.rect(ix, ruleY, r.w - 2 * (2 + 16), 1, C.blue800);
      p.text(`✨ ${ch.explanation}`, ix, lineY(ruleY + 1 + 16, 24, 16), { size: 16, color: C.yellow400, alpha: pulse(clock) });
    }
  };

  const drawBattle = (p: Painter) => {
    const pad = 32; // p-8
    p.layer(2);
    const barH = drawProgress(p, pad);
    p.layer(1);

    const arenaTop = pad + barH + 24; // mb-6
    const cardX = pad;
    const cardW = p.width - 2 * pad;
    const challengerH = 2 + 16 + 36 + 8 + 28 + 16 + 2;
    drawChallenger(p, { x: cardX, y: arenaTop, w: cardW, h: challengerH });

    if (phase !== 'myth') {
      const y = arenaTop + challengerH + 24;
      drawResponse(p, { x: cardX, y, w: cardW, h: p.height - pad - y });
    }

    if (phase === 'defeated') {
      p.layer(2);
      const cy = p.height / 2 + bounce(clock, 60);
      p.glow(p.width / 2, cy, 240, C.green400, 0.2);
      p.text('MYTH BUSTED!', p.width / 2, cy, {
        size: 60,
        color: C.green400,
        weight: 'bold',
        align: 'center',
        baseline: 'middle',
        shadow: 'rgba(74, 222, 128, 0.8)',
      });
      p.layer(1);
    }
  };

  const drawVictory = (p: Painter) => {
    const gap = 24;
    const trophyH = 96;
    const winnerH = 32 + 8 + 60;
    const quoteH = 28 * 2;
    const boardH = 1 + 16 + 20 + 40 + 16 + 1;
    const linkH = 12 + 24 + 12;
    const total = trophyH + winnerH + quoteH + boardH + linkH + 4 * gap;
    const cx = p.width / 2;
    let y = (p.height - total) / 2;

    p.text('🏆', cx, y + bounce(clock, trophyH), { size: 96, color: C.white, align: 'center' });
    y += trophyH + gap;

    p.text('WINNER', cx, lineY(y, 32, 24), { size: 24, color: C.slate400, align: 'center' });
    p.text('SQL', cx, y + 32 + 8, { size: 60, color: C.blue400, weight: 'bold', align: 'center', shadow: 'rgba(59, 130, 246, 0.8)' });
    y += winnerH + gap;

    const quote: TextStyle = { size: 18, color: C.cyan400, align: 'center' };
    p.text('"There is no NoSQL.', cx, lineY(y, 28, 18), quote);
    p.text('Only SQL you haven\'t learned yet."', cx, lineY(y + 28, 28, 18), quote);
    y += quoteH + gap;

    const scoreLabel: TextStyle = { size: 16, color: C.slate400, align: 'center' };
    const score = `${CHALLENGES.length}/${CHALLENGES.length}`;
    const scoreStyle: TextStyle = { size: 36, color: C.green400, weight: 'bold', font: 'sans', align: 'center' };
    const boardW = Math.max(p.measureText('MYTHS BUSTED', scoreLabel), p.measureText(score, scoreStyle)) + 2 * (1 + 16);
    p.box(cx - boardW / 2, y, boardW, boardH, { fill: SLATE_900_80, stroke: C.slate700, lineWidth: 1, radius: 8 });
    p.text('MYTHS BUSTED', cx, lineY(y + 1 + 16, 20, 16), scoreLabel);
    p.text(score, cx, lineY(y + 1 + 16 + 20, 40, 36), scoreStyle);
    y += boardH + gap;

    const linkStyle: TextStyle = { size: 16, color: C.white, align: 'center', shadow: 'rgba(255, 255, 255, 0.3)' };
    const linkText = 'Visit nocommasql.com →';
    const linkW = p.measureText(linkText, linkStyle) + 2 * 24;
    linkRect = { x: cx - linkW / 2, y, w: linkW, h: linkH };
    p.box(linkRect.x, linkRect.y, linkRect.w, linkRect.h, { fill: mixRgb(BLUE_600, BLUE_500, hover), radius: 8 });
    p.text(linkText, cx, lineY(y + 12, 24, 16), linkStyle);
  };

  const draw = (p: Painter) => {
    drawBackground(p);
    switch (scene) {
      case 'intro':
        drawIntro(p);
        break;
      case 'vs':
        drawVs(p);
        break;
      case 'battle':
        drawBattle(p);
        break;
      case 'victory':
        drawVictory(p);
        break;
    }
  };

  return { id: 'sql', update, draw };
};
