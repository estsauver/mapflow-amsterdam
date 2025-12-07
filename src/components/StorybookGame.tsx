import React, { useState, useEffect } from 'react';

type GameScene = 'night' | 'book_glows' | 'dreams' | 'story_forms' | 'goodnight';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface DreamBubble {
  id: number;
  x: number;
  emoji: string;
  label: string;
  color: string;
  delay: number;
  popped: boolean;
}

const STORY_ELEMENTS = [
  { emoji: '🦊', label: 'A curious little fox', color: 'from-orange-400 to-amber-500' },
  { emoji: '🌙', label: 'A magical moonlit night', color: 'from-purple-400 to-indigo-500' },
  { emoji: '🌟', label: 'A wish upon a star', color: 'from-yellow-300 to-amber-400' },
  { emoji: '🏡', label: 'A cozy woodland home', color: 'from-green-400 to-emerald-500' },
  { emoji: '💫', label: 'And a sprinkle of magic', color: 'from-pink-400 to-rose-500' },
];

const generateStars = (count: number): Star[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
  }));
};

const StorybookGame: React.FC = () => {
  const [scene, setScene] = useState<GameScene>('night');
  const [stars] = useState<Star[]>(() => generateStars(50));
  const [showMoon, setShowMoon] = useState(false);
  const [bookGlowing, setBookGlowing] = useState(false);
  const [dreamBubbles, setDreamBubbles] = useState<DreamBubble[]>([]);
  const [storyLines, setStoryLines] = useState<string[]>([]);
  const [showStealth, setShowStealth] = useState(false);

  // Night scene - moon appears
  useEffect(() => {
    if (scene !== 'night') return;

    const moonTimeout = setTimeout(() => setShowMoon(true), 1000);
    const nextScene = setTimeout(() => setScene('book_glows'), 3000);

    return () => {
      clearTimeout(moonTimeout);
      clearTimeout(nextScene);
    };
  }, [scene]);

  // Book starts glowing
  useEffect(() => {
    if (scene !== 'book_glows') return;

    const glowTimeout = setTimeout(() => setBookGlowing(true), 500);
    const nextScene = setTimeout(() => setScene('dreams'), 2500);

    return () => {
      clearTimeout(glowTimeout);
      clearTimeout(nextScene);
    };
  }, [scene]);

  // Dreams float up
  useEffect(() => {
    if (scene !== 'dreams') return;

    // Create dream bubbles one by one
    STORY_ELEMENTS.forEach((element, i) => {
      setTimeout(() => {
        setDreamBubbles(prev => [...prev, {
          id: i,
          x: 20 + (i * 15),
          emoji: element.emoji,
          label: element.label,
          color: element.color,
          delay: i * 0.5,
          popped: false,
        }]);
      }, i * 800);
    });

    const nextScene = setTimeout(() => setScene('story_forms'), 5000);
    return () => clearTimeout(nextScene);
  }, [scene]);

  // Story forms from bubbles
  useEffect(() => {
    if (scene !== 'story_forms') return;

    const lines = [
      'Once upon a time...',
      'in a cozy woodland home,',
      'there lived a curious little fox.',
      '',
      'One magical moonlit night,',
      'the fox made a wish upon a star.',
      '',
      'And with a sprinkle of magic...',
      'the wish came true.',
      '',
      'The End.',
    ];

    lines.forEach((line, i) => {
      setTimeout(() => {
        setStoryLines(prev => [...prev, line]);
        // Pop a bubble when its element appears in the story
        if (i < STORY_ELEMENTS.length) {
          setDreamBubbles(prev =>
            prev.map((b, j) => j === i ? { ...b, popped: true } : b)
          );
        }
      }, i * 600);
    });

    const nextScene = setTimeout(() => setScene('goodnight'), 8000);
    return () => clearTimeout(nextScene);
  }, [scene]);

  // Goodnight scene
  useEffect(() => {
    if (scene !== 'goodnight') return;

    const stealthTimeout = setTimeout(() => setShowStealth(true), 2000);
    return () => clearTimeout(stealthTimeout);
  }, [scene]);

  const renderStars = () => (
    <>
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: '2s',
          }}
        />
      ))}
    </>
  );

  const renderMoon = () => (
    <div
      className={`absolute transition-all duration-1000 ${showMoon ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}
      style={{ right: '15%', top: '10%' }}
    >
      <div className="relative">
        <div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200"
          style={{
            boxShadow: '0 0 60px rgba(254, 240, 138, 0.6), 0 0 120px rgba(254, 240, 138, 0.3)',
          }}
        />
        {/* Moon craters */}
        <div className="absolute top-4 left-6 w-4 h-4 rounded-full bg-yellow-300/30" />
        <div className="absolute top-10 left-12 w-3 h-3 rounded-full bg-yellow-300/20" />
        <div className="absolute top-14 left-4 w-5 h-5 rounded-full bg-yellow-300/25" />
      </div>
    </div>
  );

  const renderBedroom = () => (
    <div className="absolute bottom-0 left-0 right-0 h-1/3">
      {/* Floor/bed area */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-indigo-950 to-transparent" />

      {/* Nightstand */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-32 h-20 bg-amber-900 rounded-t-lg relative">
          {/* Book on nightstand */}
          <div
            className={`absolute -top-8 left-1/2 -translate-x-1/2 transition-all duration-500 ${bookGlowing ? 'scale-110' : ''}`}
          >
            <div
              className="w-20 h-14 bg-gradient-to-br from-rose-600 to-rose-800 rounded-sm relative"
              style={{
                boxShadow: bookGlowing
                  ? '0 0 30px rgba(251, 113, 133, 0.8), 0 0 60px rgba(251, 113, 133, 0.4)'
                  : 'none',
                transform: 'perspective(100px) rotateX(10deg)',
              }}
            >
              {/* Book spine */}
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-rose-900 rounded-l-sm" />
              {/* Book title area */}
              <div className="absolute inset-2 left-4 flex items-center justify-center">
                <span className="text-rose-200 text-xs">✨📖✨</span>
              </div>
            </div>
            {bookGlowing && (
              <div className="absolute -inset-4 animate-pulse">
                <div className="w-full h-full rounded-full bg-rose-400/20 blur-xl" />
              </div>
            )}
          </div>
        </div>
        {/* Nightstand legs */}
        <div className="flex justify-between px-2">
          <div className="w-3 h-8 bg-amber-800" />
          <div className="w-3 h-8 bg-amber-800" />
        </div>
      </div>
    </div>
  );

  const renderDreamBubbles = () => (
    <>
      {dreamBubbles.map(bubble => (
        <div
          key={bubble.id}
          className={`absolute transition-all duration-1000 ${bubble.popped ? 'opacity-0 scale-150' : 'opacity-100'}`}
          style={{
            left: `${bubble.x}%`,
            bottom: '35%',
            animation: bubble.popped ? 'none' : `float 3s ease-in-out infinite`,
            animationDelay: `${bubble.delay}s`,
          }}
        >
          <div
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${bubble.color} flex items-center justify-center relative`}
            style={{
              boxShadow: '0 0 20px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.2)',
            }}
          >
            <span className="text-3xl">{bubble.emoji}</span>
            {/* Bubble shine */}
            <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-white/40" />
          </div>
          <div className="text-center mt-2 text-white/80 text-xs font-serif max-w-24">
            {bubble.label}
          </div>
        </div>
      ))}
    </>
  );

  const renderStoryText = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="bg-amber-50/95 rounded-lg p-8 max-w-md mx-4 shadow-2xl"
        style={{
          boxShadow: '0 0 40px rgba(251, 191, 36, 0.3)',
        }}
      >
        <div className="font-serif text-amber-900 text-lg leading-relaxed text-center">
          {storyLines.map((line, i) => (
            <div
              key={i}
              className={`transition-opacity duration-500 ${line === '' ? 'h-4' : ''}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoodnight = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        <div className="text-6xl">🌙</div>

        <div className="font-serif text-amber-200 text-4xl">
          Goodnight...
        </div>

        <div className="font-serif text-amber-100/60 text-xl">
          Sweet dreams await
        </div>

        {showStealth && (
          <div className="mt-12 space-y-4 animate-pulse">
            <div className="text-purple-300/80 font-mono text-sm">
              🔮 PROJECT IN STEALTH MODE
            </div>
            <div className="text-purple-400/60 font-mono text-xs">
              More stories coming soon...
            </div>
          </div>
        )}
      </div>

      {/* Floating Zs */}
      <div className="absolute right-1/4 top-1/3 text-4xl text-blue-300/40 animate-bounce" style={{ animationDelay: '0s' }}>
        z
      </div>
      <div className="absolute right-1/4 top-1/4 text-3xl text-blue-300/30 animate-bounce" style={{ animationDelay: '0.5s' }}>
        z
      </div>
      <div className="absolute right-1/5 top-1/5 text-2xl text-blue-300/20 animate-bounce" style={{ animationDelay: '1s' }}>
        z
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950">
      {/* Stars */}
      {renderStars()}

      {/* Moon */}
      {renderMoon()}

      {/* Dream bubbles */}
      {(scene === 'dreams' || scene === 'story_forms') && renderDreamBubbles()}

      {/* Story text overlay */}
      {scene === 'story_forms' && storyLines.length > 0 && renderStoryText()}

      {/* Bedroom/nightstand */}
      {scene !== 'goodnight' && renderBedroom()}

      {/* Goodnight scene */}
      {scene === 'goodnight' && renderGoodnight()}

      {/* Ambient glow from bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(-2deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }
      `}</style>
    </div>
  );
};

export default StorybookGame;
