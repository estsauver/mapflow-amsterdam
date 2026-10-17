import { describe, it, expect } from 'vitest';
import { runProgram } from '../../lib/console/runProgram';
import type { TextRecord } from '../../lib/console/RecordingPainter';
import { createSqlGame } from '../sql';

// Every string of the original src/components/SqlGame.tsx, copied here verbatim
// so the port is checked against an independent copy of the script.
const INTRO = [
  '> LOADING NO, SQL...',
  '> "There is no NoSQL..."',
  '> "Only SQL you haven\'t learned yet."',
  '> PREPARE FOR BATTLE',
];

const CHALLENGES = [
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

const VS_TEXTS = ['🐘', 'SQL', 'VS', '👾', 'NoSQL'];
const BATTLE_TEXTS = ['SQL RESPONDS:', 'MYTH BUSTED!', '▊'];
const VICTORY_TEXTS = [
  '🏆',
  'WINNER',
  'SQL',
  '"There is no NoSQL.',
  'Only SQL you haven\'t learned yet."',
  'MYTHS BUSTED',
  `${CHALLENGES.length}/${CHALLENGES.length}`,
  'Visit nocommasql.com →',
];
const LINK_URL = 'https://nocommasql.com';

/** The code is drawn one line at a time, so the completed typewriter text is every non-empty line. */
const codeLines = (sql: string) => sql.split('\n').filter(line => line !== '');
const ALL_CODE_LINES = CHALLENGES.flatMap(c => codeLines(c.sql));

// Timeline of the original (seconds): intro 7 × 0.4 + 0.4 + 1.0; vs 2.5; per challenge
// 2.0 myth + (len + 2) × 0.025 typing + 0.5 hold + 3.0 defeated; then victory forever.
const INTRO_END = 4.2;
const VS_END = INTRO_END + 2.5;
const challengeDuration = (sql: string) => 2 + (sql.length + 2) * 0.025 + 0.5 + 3;
const CHALLENGE_STARTS = CHALLENGES.reduce<number[]>((acc, c, i) => {
  acc.push(i === 0 ? VS_END : acc[i - 1] + challengeDuration(CHALLENGES[i - 1].sql));
  return acc;
}, []);
const VICTORY_START = CHALLENGE_STARTS[3] + challengeDuration(CHALLENGES[3].sql);

const textsAt = (seconds: number, width = 960) => {
  const r = runProgram(createSqlGame, { seconds, width });
  expect(r.errors).toEqual([]);
  return { seen: r.textsSeen, last: r.lastTexts.map(t => t.text), records: r.lastTexts };
};

describe('sql game: narrative', () => {
  it('plays the whole script for its real duration without errors and ends on the victory scene', () => {
    const r = runProgram(createSqlGame, { seconds: 50, fps: 60 });
    expect(r.frames).toBe(3000);
    expect(r.errors).toEqual([]);
    const last = r.lastTexts.map(t => t.text);
    for (const t of VICTORY_TEXTS) expect(last).toContain(t);
    expect(last).not.toContain('MYTH BUSTED!');
  });

  it('draws every line of the original script verbatim', () => {
    const { seen } = textsAt(50);
    for (const line of INTRO) expect(seen).toContain(line);
    for (const t of VS_TEXTS) expect(seen).toContain(t);
    for (const c of CHALLENGES) {
      expect(seen).toContain(c.mythIcon);
      expect(seen).toContain(`CHALLENGER: ${c.nosqlName}`);
      expect(seen).toContain(`⚔️ "${c.myth}"`);
      expect(seen).toContain(`✨ ${c.explanation}`);
      for (const line of codeLines(c.sql)) expect(seen).toContain(line);
    }
    for (const t of BATTLE_TEXTS) expect(seen).toContain(t);
    for (const t of VICTORY_TEXTS) expect(seen).toContain(t);
  });

  it('reveals the intro one line every 400 ms and holds a second before the VS screen', () => {
    expect(textsAt(0.3).seen.size).toBe(0);
    const first = textsAt(0.6);
    expect(first.last).toEqual([INTRO[0]]);
    const all = textsAt(3.0).last;
    expect(all).toEqual(INTRO);
    expect(textsAt(INTRO_END - 0.1).last).toEqual(INTRO);
    expect(textsAt(INTRO_END - 0.1).last).not.toContain('VS');
    const vs = textsAt(INTRO_END + 0.2).last;
    for (const t of VS_TEXTS) expect(vs).toContain(t);
    expect(vs).not.toContain(INTRO[0]);
  });

  it('strobes the VS screen for 2.5 s and then opens the battle on the first myth', () => {
    expect(textsAt(VS_END - 0.1).last).toContain('VS');
    const battle = textsAt(VS_END + 0.2).last;
    expect(battle).not.toContain('VS');
    expect(battle).toContain('CHALLENGER: MongoDB');
    expect(battle).toContain(`⚔️ "${CHALLENGES[0].myth}"`);
    expect(battle).not.toContain('SQL RESPONDS:');
  });

  it('types the SQL response at 25 ms per character after a 2 s myth phase', () => {
    const typingStart = VS_END + 2;
    const firstLine = codeLines(CHALLENGES[0].sql)[0]; // 29 chars: complete 0.75 s into typing
    const early = textsAt(typingStart + 0.5).last;
    expect(early).toContain('SQL RESPONDS:');
    expect(early).toContain('▊');
    expect(early).not.toContain(firstLine);
    expect(early.some(t => t !== firstLine && firstLine.startsWith(t) && t.length > 0)).toBe(true);
    const later = textsAt(typingStart + 0.9).last;
    expect(later).toContain(firstLine);
    expect(later).toContain('▊');
    expect(later).not.toContain(`✨ ${CHALLENGES[0].explanation}`);
  });

  it('busts the myth 0.5 s after the last character and holds the banner for 3 s', () => {
    const defeatedStart = VS_END + 2 + (CHALLENGES[0].sql.length + 2) * 0.025 + 0.5;
    const beforeBust = textsAt(defeatedStart - 0.1).last;
    expect(beforeBust).not.toContain('MYTH BUSTED!');
    const busted = textsAt(defeatedStart + 0.2).last;
    expect(busted).toContain('MYTH BUSTED!');
    expect(busted).toContain(`✨ ${CHALLENGES[0].explanation}`);
    expect(busted).not.toContain('▊');
    for (const line of codeLines(CHALLENGES[0].sql)) expect(busted).toContain(line);
    const next = textsAt(CHALLENGE_STARTS[1] + 0.2).last;
    expect(next).not.toContain('MYTH BUSTED!');
    expect(next).toContain('CHALLENGER: Redis');
    expect(next).not.toContain('CHALLENGER: MongoDB');
  });

  it('walks every challenger in order and reaches victory at the original time, then stays there', () => {
    CHALLENGES.forEach((c, i) => {
      expect(textsAt(CHALLENGE_STARTS[i] + 0.5).last).toContain(`CHALLENGER: ${c.nosqlName}`);
    });
    const lastBattle = textsAt(VICTORY_START - 0.2).last;
    expect(lastBattle).toContain('MYTH BUSTED!');
    expect(lastBattle).not.toContain('WINNER');
    const victory = textsAt(VICTORY_START + 0.2).last;
    for (const t of VICTORY_TEXTS) expect(victory).toContain(t);
    const stillVictory = textsAt(70, 960).last;
    for (const t of VICTORY_TEXTS) expect(stillVictory).toContain(t);
    expect(stillVictory).not.toContain(INTRO[0]);
  });
});

describe('sql game: interactions', () => {
  const linkRecord = (records: TextRecord[]) => {
    const rec = records.find(t => t.text === 'Visit nocommasql.com →');
    expect(rec).toBeDefined();
    return rec as TextRecord;
  };

  it('opens nocommasql.com through the host when the victory link is clicked', () => {
    const link = linkRecord(textsAt(VICTORY_START + 1).records);
    const r = runProgram(createSqlGame, {
      seconds: VICTORY_START + 2,
      clicks: [{ at: VICTORY_START + 1.5, x: link.x, y: link.y + 8 }],
    });
    expect(r.errors).toEqual([]);
    expect(r.opened).toEqual([LINK_URL]);
  });

  it('opens once per click and ignores clicks outside the button or before victory', () => {
    const link = linkRecord(textsAt(VICTORY_START + 1).records);
    const twice = runProgram(createSqlGame, {
      seconds: VICTORY_START + 2,
      clicks: [
        { at: VICTORY_START + 1.2, x: link.x, y: link.y + 8 },
        { at: VICTORY_START + 1.6, x: link.x, y: link.y + 8 },
      ],
    });
    expect(twice.opened).toEqual([LINK_URL, LINK_URL]);

    const outside = runProgram(createSqlGame, {
      seconds: VICTORY_START + 2,
      clicks: [{ at: VICTORY_START + 1.5, x: 20, y: 20 }],
    });
    expect(outside.opened).toEqual([]);

    const early = runProgram(createSqlGame, {
      seconds: 21,
      clicks: [{ at: 20, x: link.x, y: link.y + 8 }],
    });
    expect(early.opened).toEqual([]);
  });

  it('is not advanced by clicks or keys: the narrative is autoplay only', () => {
    const r = runProgram(createSqlGame, {
      seconds: 3,
      clicks: [{ at: 1, x: 480, y: 270 }, { at: 2, x: 480, y: 270 }],
      keys: [{ at: 1.5, key: ' ' }, { at: 2.5, key: 'Enter' }],
    });
    expect(r.errors).toEqual([]);
    expect(r.lastTexts.map(t => t.text)).toEqual(INTRO);
  });
});

describe('sql game: layout', () => {
  const SAMPLE_TIMES = [0.6, 3, VS_END - 0.1, VS_END + 0.5, VS_END + 3, CHALLENGE_STARTS[0] + 6.5, CHALLENGE_STARTS[3] + 7, VICTORY_START + 1];
  const MONO_CHAR = 16 * 0.6; // RecordingPainter's mono advance at the 16 px code size

  for (const width of [700, 1300]) {
    it(`keeps every text position inside a ${width} × 540 frame in every scene`, () => {
      for (const seconds of SAMPLE_TIMES) {
        const { records } = textsAt(seconds, width);
        expect(records.length).toBeGreaterThan(0);
        for (const rec of records) {
          expect(rec.x, `${rec.text} at ${seconds}s`).toBeGreaterThanOrEqual(0);
          expect(rec.x, `${rec.text} at ${seconds}s`).toBeLessThanOrEqual(width);
          expect(rec.y, `${rec.text} at ${seconds}s`).toBeGreaterThanOrEqual(0);
          expect(rec.y, `${rec.text} at ${seconds}s`).toBeLessThanOrEqual(540);
          if (ALL_CODE_LINES.includes(rec.text)) {
            expect(rec.x + rec.text.length * MONO_CHAR, `${rec.text} overflows`).toBeLessThanOrEqual(width - 32);
          }
        }
      }
    });
  }

  it('anchors the battle cards to the frame edges and centres the VS screen', () => {
    for (const width of [700, 1300]) {
      const battle = textsAt(CHALLENGE_STARTS[0] + 0.5, width).records;
      const challenger = battle.find(t => t.text === 'CHALLENGER: MongoDB');
      expect(challenger).toBeDefined();
      expect(challenger!.x).toBeLessThan(120);
      const vs = textsAt(VS_END - 0.1, width).records.find(t => t.text === 'VS');
      expect(vs!.x).toBeCloseTo(width / 2, 0);
    }
  });
});
