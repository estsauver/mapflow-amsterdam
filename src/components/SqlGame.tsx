import React, { useState, useEffect } from 'react';

type GameScene = 'intro' | 'vs' | 'battle' | 'victory';

interface Challenge {
  myth: string;
  mythIcon: string;
  nosqlName: string;
  sql: string;
  explanation: string;
}

const CHALLENGES: Challenge[] = [
  {
    myth: "You need MongoDB for JSON documents!",
    mythIcon: "🍃",
    nosqlName: "MongoDB",
    sql: `SELECT data->>'name' AS name,
       data->>'email' AS email
FROM users
WHERE data @> '{"active": true}';`,
    explanation: "PostgreSQL JSONB since 2014"
  },
  {
    myth: "You need Redis for key-value storage!",
    mythIcon: "🔴",
    nosqlName: "Redis",
    sql: `CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  value JSONB,
  expires_at TIMESTAMPTZ
);

-- With UPSERT support!
INSERT INTO cache VALUES (...)
ON CONFLICT (key) DO UPDATE...`,
    explanation: "SQL handles KV just fine"
  },
  {
    myth: "You need Neo4j for graph queries!",
    mythIcon: "🕸️",
    nosqlName: "Neo4j",
    sql: `WITH RECURSIVE team AS (
  SELECT id, name, manager_id
  FROM employees WHERE id = 1
  UNION ALL
  SELECT e.id, e.name, e.manager_id
  FROM employees e
  JOIN team t ON e.manager_id = t.id
)
SELECT * FROM team;`,
    explanation: "Recursive CTEs are powerful"
  },
  {
    myth: "You need Elasticsearch for search!",
    mythIcon: "🔍",
    nosqlName: "Elasticsearch",
    sql: `SELECT title, ts_rank(search, q) AS rank
FROM articles,
     to_tsquery('postgres & rocks') q
WHERE search @@ q
ORDER BY rank DESC;

-- With trigram fuzzy matching!
CREATE INDEX ON articles
  USING gin(title gin_trgm_ops);`,
    explanation: "Full-text search built-in"
  },
];

const SqlGame: React.FC = () => {
  const [scene, setScene] = useState<GameScene>('intro');
  const [introText, setIntroText] = useState<string[]>([]);
  const [showVsFlash, setShowVsFlash] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [battlePhase, setBattlePhase] = useState<'myth' | 'typing' | 'defeated'>('myth');
  const [typedSql, setTypedSql] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

  // Intro sequence
  useEffect(() => {
    if (scene !== 'intro') return;

    const messages = [
      '> LOADING NO, SQL...',
      '',
      '> "There is no NoSQL..."',
      '',
      '> "Only SQL you haven\'t learned yet."',
      '',
      '> PREPARE FOR BATTLE',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < messages.length) {
        setIntroText(prev => [...prev, messages[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setScene('vs'), 1000);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [scene]);

  // VS screen
  useEffect(() => {
    if (scene !== 'vs') return;

    const flashInterval = setInterval(() => {
      setShowVsFlash(v => !v);
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(flashInterval);
      setScene('battle');
    }, 2500);

    return () => {
      clearInterval(flashInterval);
      clearTimeout(timeout);
    };
  }, [scene]);

  // Battle sequence
  useEffect(() => {
    if (scene !== 'battle') return;

    if (battlePhase === 'myth') {
      const timeout = setTimeout(() => {
        setBattlePhase('typing');
      }, 2000);
      return () => clearTimeout(timeout);
    }

    if (battlePhase === 'typing') {
      const challenge = CHALLENGES[currentChallenge];
      let charIndex = 0;

      const interval = setInterval(() => {
        if (charIndex <= challenge.sql.length) {
          setTypedSql(challenge.sql.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setShowExplanation(true);
            setBattlePhase('defeated');
          }, 500);
        }
      }, 25);

      return () => clearInterval(interval);
    }

    if (battlePhase === 'defeated') {
      const timeout = setTimeout(() => {
        if (currentChallenge < CHALLENGES.length - 1) {
          // Next challenge
          setCurrentChallenge(c => c + 1);
          setBattlePhase('myth');
          setTypedSql('');
          setShowExplanation(false);
        } else {
          // Victory!
          setScene('victory');
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [scene, battlePhase, currentChallenge]);

  const renderIntro = () => (
    <div className="flex items-center justify-center h-full">
      <div className="font-mono text-xl text-center">
        {introText.map((line, i) => (
          <div
            key={i}
            className={`${line?.startsWith('>') ? 'text-cyan-400' : 'text-white'} ${line === '' ? 'h-4' : ''}`}
            style={{ textShadow: '0 0 10px currentColor' }}
          >
            {line || ''}
          </div>
        ))}
      </div>
    </div>
  );

  const renderVs = () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-8">
        {/* SQL side */}
        <div className="text-center">
          <div className="text-8xl mb-4">🐘</div>
          <div
            className="text-4xl font-bold text-blue-400"
            style={{ fontFamily: 'monospace', textShadow: '0 0 20px rgba(59, 130, 246, 0.8)' }}
          >
            SQL
          </div>
        </div>

        {/* VS */}
        <div
          className={`text-6xl font-bold ${showVsFlash ? 'text-yellow-400' : 'text-red-500'}`}
          style={{
            fontFamily: 'monospace',
            textShadow: showVsFlash ? '0 0 30px rgba(250, 204, 21, 0.8)' : '0 0 30px rgba(239, 68, 68, 0.8)'
          }}
        >
          VS
        </div>

        {/* NoSQL side */}
        <div className="text-center">
          <div className="text-8xl mb-4">👾</div>
          <div
            className="text-4xl font-bold text-red-400"
            style={{ fontFamily: 'monospace', textShadow: '0 0 20px rgba(248, 113, 113, 0.8)' }}
          >
            NoSQL
          </div>
        </div>
      </div>
    </div>
  );

  const renderBattle = () => {
    const challenge = CHALLENGES[currentChallenge];

    return (
      <div className="h-full flex flex-col p-8">
        {/* Progress bar */}
        <div className="flex gap-2 mb-6 justify-center">
          {CHALLENGES.map((_, i) => (
            <div
              key={i}
              className={`w-8 h-2 rounded ${
                i < currentChallenge ? 'bg-green-500' :
                i === currentChallenge ? 'bg-yellow-500 animate-pulse' :
                'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Battle arena */}
        <div className="flex-1 flex flex-col">
          {/* Challenger (NoSQL myth) */}
          <div className={`mb-6 transition-all duration-500 ${battlePhase === 'defeated' ? 'opacity-30 scale-95' : ''}`}>
            <div className="bg-red-950/50 border-2 border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{challenge.mythIcon}</span>
                <span className="text-red-400 font-mono text-sm">CHALLENGER: {challenge.nosqlName}</span>
              </div>
              <div className="text-white font-mono text-lg" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                ⚔️ "{challenge.myth}"
              </div>
            </div>
          </div>

          {/* SQL Response */}
          {battlePhase !== 'myth' && (
            <div className="flex-1">
              <div className="bg-blue-950/50 border-2 border-blue-800 rounded-lg p-4 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🐘</span>
                  <span className="text-blue-400 font-mono text-sm">SQL RESPONDS:</span>
                </div>
                <pre className="text-green-400 font-mono text-sm overflow-hidden whitespace-pre-wrap">
                  {typedSql}
                  {battlePhase === 'typing' && <span className="animate-pulse">▊</span>}
                </pre>

                {showExplanation && (
                  <div className="mt-4 pt-4 border-t border-blue-800">
                    <div className="text-yellow-400 font-mono animate-pulse">
                      ✨ {challenge.explanation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Defeated banner */}
          {battlePhase === 'defeated' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="text-6xl font-bold text-green-400 animate-bounce"
                style={{
                  fontFamily: 'monospace',
                  textShadow: '0 0 30px rgba(74, 222, 128, 0.8), 0 0 60px rgba(74, 222, 128, 0.4)'
                }}
              >
                MYTH BUSTED!
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVictory = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-8">
        {/* Trophy */}
        <div className="text-8xl animate-bounce">🏆</div>

        {/* Winner */}
        <div>
          <div className="text-2xl text-slate-400 font-mono mb-2">WINNER</div>
          <div
            className="text-6xl font-bold text-blue-400"
            style={{
              fontFamily: 'monospace',
              textShadow: '0 0 30px rgba(59, 130, 246, 0.8)'
            }}
          >
            SQL
          </div>
        </div>

        {/* Quote */}
        <div className="max-w-md mx-auto">
          <div className="text-cyan-400 font-mono text-lg italic">
            "There is no NoSQL.
          </div>
          <div className="text-cyan-400 font-mono text-lg italic">
            Only SQL you haven't learned yet."
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 inline-block">
          <div className="font-mono text-sm text-slate-400">MYTHS BUSTED</div>
          <div className="text-4xl font-bold text-green-400">{CHALLENGES.length}/{CHALLENGES.length}</div>
        </div>

        {/* Link */}
        <div>
          <a
            href="https://nocommasql.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-mono rounded-lg transition-colors"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
          >
            Visit nocommasql.com →
          </a>
        </div>
      </div>
    </div>
  );

  const renderScene = () => {
    switch (scene) {
      case 'intro':
        return renderIntro();
      case 'vs':
        return renderVs();
      case 'battle':
        return renderBattle();
      case 'victory':
        return renderVictory();
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Arcade cabinet border effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.8)',
          borderRadius: '10px',
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full">
        {renderScene()}
      </div>

      {/* Ambient glow based on scene */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: scene === 'victory'
            ? 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
            : scene === 'battle'
            ? 'radial-gradient(ellipse at center, rgba(234, 179, 8, 0.05) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.05) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default SqlGame;
