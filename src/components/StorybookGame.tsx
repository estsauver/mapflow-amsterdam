import React, { useState, useEffect } from 'react';

type GameScene = 'library' | 'request' | 'creating' | 'reveal' | 'complete';

interface BookRequest {
  childName: string;
  request: string;
  bookTitle: string;
  coverType: 'dino' | 'princess' | 'bunny';
  hairColor: string;
  storyPreview: string;
}

const BOOK_REQUESTS: BookRequest[] = [
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

// SVG Components
const ChildAvatar: React.FC<{ hairColor: string }> = ({ hairColor }) => (
  <svg viewBox="0 0 80 80" className="w-20 h-20">
    {/* Face */}
    <circle cx="40" cy="42" r="28" fill="#FDBF6F" />
    {/* Hair */}
    <ellipse cx="40" cy="28" rx="26" ry="18" fill={hairColor} />
    <ellipse cx="20" cy="35" rx="8" ry="12" fill={hairColor} />
    <ellipse cx="60" cy="35" rx="8" ry="12" fill={hairColor} />
    {/* Eyes */}
    <circle cx="32" cy="42" r="4" fill="#2D1B0E" />
    <circle cx="48" cy="42" r="4" fill="#2D1B0E" />
    <circle cx="33" cy="41" r="1.5" fill="white" />
    <circle cx="49" cy="41" r="1.5" fill="white" />
    {/* Smile */}
    <path d="M 32 54 Q 40 62 48 54" stroke="#2D1B0E" strokeWidth="2" fill="none" strokeLinecap="round" />
    {/* Cheeks */}
    <circle cx="24" cy="50" r="4" fill="#FFB6C1" opacity="0.5" />
    <circle cx="56" cy="50" r="4" fill="#FFB6C1" opacity="0.5" />
  </svg>
);

const DinoBookCover: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    {/* Dinosaur body */}
    <ellipse cx="50" cy="60" rx="25" ry="20" fill="#4ADE80" />
    {/* Head */}
    <circle cx="70" cy="45" r="15" fill="#4ADE80" />
    {/* Eye */}
    <circle cx="74" cy="42" r="4" fill="white" />
    <circle cx="75" cy="42" r="2" fill="#2D1B0E" />
    {/* Smile */}
    <path d="M 68 52 Q 74 56 80 52" stroke="#2D1B0E" strokeWidth="2" fill="none" />
    {/* Hard hat */}
    <ellipse cx="70" cy="32" rx="14" ry="8" fill="#FCD34D" />
    <rect x="56" y="30" width="28" height="6" fill="#FCD34D" />
    {/* Tail */}
    <path d="M 25 60 Q 10 50 15 70" stroke="#4ADE80" strokeWidth="12" fill="none" strokeLinecap="round" />
    {/* Legs */}
    <rect x="35" y="75" width="8" height="15" rx="3" fill="#4ADE80" />
    <rect x="55" y="75" width="8" height="15" rx="3" fill="#4ADE80" />
    {/* Arms with tool */}
    <rect x="40" y="50" width="6" height="12" rx="2" fill="#4ADE80" />
    {/* Hammer */}
    <rect x="38" y="45" width="3" height="15" fill="#8B4513" />
    <rect x="34" y="42" width="10" height="6" rx="1" fill="#6B7280" />
  </svg>
);

const PrincessBookCover: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    {/* Rocket */}
    <ellipse cx="70" cy="50" rx="12" ry="25" fill="#E5E7EB" />
    <ellipse cx="70" cy="30" rx="8" ry="10" fill="#EF4444" />
    {/* Rocket window */}
    <circle cx="70" cy="45" r="6" fill="#60A5FA" />
    {/* Flames */}
    <path d="M 62 75 Q 70 90 78 75" fill="#F97316" />
    <path d="M 65 75 Q 70 85 75 75" fill="#FCD34D" />
    {/* Princess */}
    <circle cx="35" cy="45" r="12" fill="#FDBF6F" />
    {/* Crown */}
    <path d="M 25 35 L 28 28 L 32 35 L 35 25 L 38 35 L 42 28 L 45 35" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
    {/* Hair */}
    <path d="M 23 45 Q 20 60 30 65" stroke="#8B4513" strokeWidth="4" fill="none" />
    <path d="M 47 45 Q 50 60 40 65" stroke="#8B4513" strokeWidth="4" fill="none" />
    {/* Eyes */}
    <circle cx="31" cy="44" r="2" fill="#2D1B0E" />
    <circle cx="39" cy="44" r="2" fill="#2D1B0E" />
    {/* Smile */}
    <path d="M 32 50 Q 35 54 38 50" stroke="#2D1B0E" strokeWidth="1.5" fill="none" />
    {/* Dress */}
    <path d="M 25 55 L 35 80 L 45 55" fill="#EC4899" />
    {/* Stars */}
    <circle cx="15" cy="20" r="2" fill="#FCD34D" />
    <circle cx="85" cy="15" r="1.5" fill="#FCD34D" />
    <circle cx="20" cy="80" r="1.5" fill="#FCD34D" />
  </svg>
);

const BunnyBookCover: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    {/* Bunny body */}
    <ellipse cx="40" cy="60" rx="20" ry="22" fill="#F5F5F4" />
    {/* Head */}
    <circle cx="40" cy="35" r="18" fill="#F5F5F4" />
    {/* Ears */}
    <ellipse cx="28" cy="12" rx="6" ry="18" fill="#F5F5F4" />
    <ellipse cx="28" cy="12" rx="3" ry="12" fill="#FECACA" />
    <ellipse cx="52" cy="12" rx="6" ry="18" fill="#F5F5F4" />
    <ellipse cx="52" cy="12" rx="3" ry="12" fill="#FECACA" />
    {/* Eyes */}
    <circle cx="34" cy="32" r="3" fill="#2D1B0E" />
    <circle cx="46" cy="32" r="3" fill="#2D1B0E" />
    <circle cx="35" cy="31" r="1" fill="white" />
    <circle cx="47" cy="31" r="1" fill="white" />
    {/* Nose */}
    <ellipse cx="40" cy="40" rx="3" ry="2" fill="#FECACA" />
    {/* Whiskers */}
    <line x1="25" y1="38" x2="32" y2="40" stroke="#D1D5DB" strokeWidth="1" />
    <line x1="25" y1="42" x2="32" y2="42" stroke="#D1D5DB" strokeWidth="1" />
    <line x1="48" y1="40" x2="55" y2="38" stroke="#D1D5DB" strokeWidth="1" />
    <line x1="48" y1="42" x2="55" y2="42" stroke="#D1D5DB" strokeWidth="1" />
    {/* Chef hat */}
    <ellipse cx="40" cy="18" rx="14" ry="6" fill="white" stroke="#E5E7EB" />
    <ellipse cx="40" cy="12" rx="10" ry="8" fill="white" />
    {/* Cookie */}
    <circle cx="75" cy="60" r="15" fill="#D97706" />
    <circle cx="70" cy="55" r="2" fill="#78350F" />
    <circle cx="78" cy="58" r="2" fill="#78350F" />
    <circle cx="74" cy="65" r="2" fill="#78350F" />
    <circle cx="80" cy="65" r="1.5" fill="#78350F" />
    {/* Paws holding tray */}
    <ellipse cx="55" cy="70" rx="6" ry="4" fill="#F5F5F4" />
  </svg>
);

const Sparkle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className || "w-6 h-6"}>
    <path
      d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
      fill="#FCD34D"
    />
  </svg>
);

const BookStackIcon: React.FC = () => (
  <svg viewBox="0 0 80 80" className="w-16 h-16">
    {/* Bottom book */}
    <rect x="10" y="50" width="60" height="12" rx="2" fill="#3B82F6" />
    <rect x="10" y="50" width="4" height="12" fill="#2563EB" />
    {/* Middle book */}
    <rect x="15" y="36" width="55" height="12" rx="2" fill="#EF4444" />
    <rect x="15" y="36" width="4" height="12" fill="#DC2626" />
    {/* Top book */}
    <rect x="12" y="22" width="58" height="12" rx="2" fill="#22C55E" />
    <rect x="12" y="22" width="4" height="12" fill="#16A34A" />
    {/* Decorative lines */}
    <line x1="25" y1="28" x2="55" y2="28" stroke="white" strokeWidth="1" opacity="0.5" />
    <line x1="30" y1="42" x2="55" y2="42" stroke="white" strokeWidth="1" opacity="0.5" />
    <line x1="25" y1="56" x2="50" y2="56" stroke="white" strokeWidth="1" opacity="0.5" />
  </svg>
);

const StorybookGame: React.FC = () => {
  const [scene, setScene] = useState<GameScene>('library');
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
  const [typedRequest, setTypedRequest] = useState('');
  const [creatingPhase, setCreatingPhase] = useState(0);
  const [booksCreated, setBooksCreated] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);

  const currentRequest = BOOK_REQUESTS[currentRequestIndex];

  // Library intro
  useEffect(() => {
    if (scene !== 'library') return;
    const timeout = setTimeout(() => setScene('request'), 2500);
    return () => clearTimeout(timeout);
  }, [scene]);

  // Type out the child's request
  useEffect(() => {
    if (scene !== 'request') return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= currentRequest.request.length) {
        setTypedRequest(currentRequest.request.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setScene('creating'), 1500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [scene, currentRequest]);

  // Creating animation phases
  useEffect(() => {
    if (scene !== 'creating') return;

    const phases = [1, 2, 3, 4];
    let phaseIndex = 0;

    // Add sparkles periodically
    const sparkleInterval = setInterval(() => {
      const newSparkle = {
        id: Date.now(),
        x: 40 + Math.random() * 20,
        y: 30 + Math.random() * 30,
      };
      setSparkles(prev => [...prev.slice(-10), newSparkle]);
    }, 200);

    const interval = setInterval(() => {
      if (phaseIndex < phases.length) {
        setCreatingPhase(phases[phaseIndex]);
        phaseIndex++;
      } else {
        clearInterval(interval);
        clearInterval(sparkleInterval);
        setSparkles([]);
        setTimeout(() => setScene('reveal'), 500);
      }
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(sparkleInterval);
    };
  }, [scene]);

  // Reveal and complete
  useEffect(() => {
    if (scene !== 'reveal') return;
    const timeout = setTimeout(() => {
      setBooksCreated(c => c + 1);
      setScene('complete');
    }, 3000);
    return () => clearTimeout(timeout);
  }, [scene]);

  // Move to next request or finish
  useEffect(() => {
    if (scene !== 'complete') return;
    const timeout = setTimeout(() => {
      if (currentRequestIndex < BOOK_REQUESTS.length - 1) {
        setCurrentRequestIndex(i => i + 1);
        setTypedRequest('');
        setCreatingPhase(0);
        setScene('request');
      }
    }, 2500);
    return () => clearTimeout(timeout);
  }, [scene, currentRequestIndex]);

  const renderBookCover = (type: 'dino' | 'princess' | 'bunny') => {
    switch (type) {
      case 'dino': return <DinoBookCover />;
      case 'princess': return <PrincessBookCover />;
      case 'bunny': return <BunnyBookCover />;
    }
  };

  const renderRobot = (speaking: boolean = false) => (
    <div className="relative">
      {/* Robot body */}
      <div className="w-32 h-40 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-3xl relative">
        {/* Eyes */}
        <div className="absolute top-6 left-0 right-0 flex justify-center gap-4">
          <div className={`w-8 h-8 rounded-full bg-cyan-400 ${speaking ? 'animate-pulse' : ''}`}
            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
            <div className="w-3 h-3 bg-white rounded-full mt-1 ml-1" />
          </div>
          <div className={`w-8 h-8 rounded-full bg-cyan-400 ${speaking ? 'animate-pulse' : ''}`}
            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)' }}>
            <div className="w-3 h-3 bg-white rounded-full mt-1 ml-1" />
          </div>
        </div>
        {/* Mouth/speaker */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-4 bg-slate-700 rounded-full flex items-center justify-center gap-1 ${speaking ? 'animate-pulse' : ''}`}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-2 ${speaking ? 'h-3' : 'h-1'} bg-cyan-400 rounded-full transition-all`} />
          ))}
        </div>
        {/* Antenna */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <div className="w-1 h-6 bg-slate-600" />
          <div className={`w-4 h-4 rounded-full bg-red-500 -ml-1.5 ${speaking ? 'animate-ping' : 'animate-pulse'}`} />
        </div>
      </div>
      {/* Arms */}
      <div className="absolute top-24 -left-8 w-8 h-20 bg-slate-400 rounded-full" />
      <div className="absolute top-24 -right-8 w-8 h-20 bg-slate-400 rounded-full" />
      {/* Label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 px-3 py-1 rounded text-xs font-mono text-white">
        LIBR-4R1
      </div>
    </div>
  );

  const renderBookshelf = () => (
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-amber-900">
      <div className="h-4 bg-amber-800" />
      <div className="flex justify-around items-end h-24 px-4">
        {[...Array(booksCreated)].map((_, i) => (
          <div
            key={i}
            className="w-8 h-20 rounded-t-sm"
            style={{
              background: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i % 4],
              transform: `rotate(${(i * 2) % 6 - 3}deg)`,
            }}
          />
        ))}
        {[...Array(Math.max(0, 8 - booksCreated))].map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-20 opacity-0" />
        ))}
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="h-full flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200" />

      <div className="absolute inset-0 opacity-20">
        {[...Array(3)].map((_, row) => (
          <div key={row} className="flex justify-around mt-8">
            {[...Array(8)].map((_, col) => (
              <div
                key={col}
                className="w-6 h-16 bg-amber-800 rounded-t-sm"
                style={{ opacity: 0.3 + ((col + row) % 3) * 0.2 }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center">
        {renderRobot(true)}
        <div className="mt-8 bg-white/90 rounded-xl px-8 py-4 shadow-lg">
          <div className="text-amber-800 font-serif text-2xl flex items-center justify-center gap-2">
            <Sparkle className="w-6 h-6" />
            The Story Machine
            <Sparkle className="w-6 h-6" />
          </div>
          <div className="text-amber-600 text-sm mt-2">
            "Tell me what book you'd like, and I'll create it!"
          </div>
        </div>
      </div>

      {renderBookshelf()}
    </div>
  );

  const renderRequest = () => (
    <div className="h-full flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <div className="flex items-end gap-8">
          <div className="text-center">
            <ChildAvatar hairColor={currentRequest.hairColor} />
            <div className="font-serif text-amber-800">{currentRequest.childName}</div>
          </div>

          <div className="relative bg-white rounded-2xl px-6 py-4 shadow-lg max-w-md">
            <div className="absolute -left-4 bottom-4 w-0 h-0 border-t-[10px] border-t-transparent border-r-[20px] border-r-white border-b-[10px] border-b-transparent" />
            <div className="font-serif text-amber-900 text-lg">
              "{typedRequest}"
              <span className="animate-pulse">|</span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          {renderRobot(typedRequest.length > 0)}
        </div>
      </div>

      {renderBookshelf()}
    </div>
  );

  const renderCreating = () => (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 to-indigo-950" />

      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute animate-ping"
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
        >
          <Sparkle className="w-8 h-8" />
        </div>
      ))}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <div className="mb-8">
          {renderRobot(true)}
        </div>

        <div className="relative w-48 h-64">
          <div
            className={`absolute inset-0 bg-white rounded-lg shadow-2xl transition-all duration-500 ${
              creatingPhase >= 1 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: creatingPhase >= 2 ? 'rotateY(10deg)' : 'rotateY(0deg)',
              boxShadow: creatingPhase >= 3 ? '0 0 60px rgba(168, 85, 247, 0.8)' : '0 0 20px rgba(255,255,255,0.3)',
            }}
          >
            {creatingPhase >= 2 && creatingPhase < 4 && (
              <div className="p-4 font-serif text-slate-400 text-sm animate-pulse">
                {creatingPhase >= 3 && (
                  <>
                    <div className="h-2 bg-slate-300 rounded mb-2 w-3/4" />
                    <div className="h-2 bg-slate-300 rounded mb-2 w-full" />
                    <div className="h-2 bg-slate-300 rounded mb-2 w-5/6" />
                  </>
                )}
              </div>
            )}
            {creatingPhase >= 4 && (
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                {renderBookCover(currentRequest.coverType)}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-white font-mono text-center">
          {creatingPhase === 1 && 'Preparing blank pages...'}
          {creatingPhase === 2 && 'Writing story...'}
          {creatingPhase === 3 && 'Creating illustrations...'}
          {creatingPhase === 4 && 'Binding book...'}
        </div>
      </div>
    </div>
  );

  const renderReveal = () => (
    <div className="h-full flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        <div
          className="relative w-56 h-72 rounded-lg shadow-2xl transform hover:scale-105 transition-transform animate-bounce"
          style={{
            background: 'linear-gradient(135deg, #f43f5e, #a855f7)',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
          }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20 rounded-l-lg" />

          <div className="flex flex-col items-center justify-center h-full text-white">
            {renderBookCover(currentRequest.coverType)}
            <div className="text-lg font-bold text-center px-4 font-serif mt-2">
              {currentRequest.bookTitle}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white/90 rounded-xl px-6 py-4 shadow-lg max-w-md">
          <div className="text-amber-800 font-serif italic">
            "{currentRequest.storyPreview}"
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-400 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-cyan-400 rounded-full" />
          </div>
          <div className="bg-cyan-100 rounded-xl px-4 py-2 text-cyan-800 font-mono text-sm">
            "Here you go, {currentRequest.childName}!"
          </div>
        </div>
      </div>

      {renderBookshelf()}
    </div>
  );

  const renderComplete = () => (
    <div className="h-full flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {renderRobot(false)}

        <div className="mt-8 text-center">
          <BookStackIcon />
          <div className="text-amber-800 font-serif text-2xl mb-2 mt-2">
            Books Created: {booksCreated}
          </div>
          {currentRequestIndex >= BOOK_REQUESTS.length - 1 && (
            <>
              <div className="text-amber-600 font-serif mt-4">
                Every child's imagination deserves a story.
              </div>
              <div className="mt-8 space-y-2">
                <div className="text-purple-600 font-mono text-sm">
                  PROJECT UNNAMED
                </div>
                <div className="text-purple-400 font-mono text-xs">
                  More stories coming soon...
                </div>
              </div>
            </>
          )}
          {currentRequestIndex < BOOK_REQUESTS.length - 1 && (
            <div className="text-amber-500 text-sm animate-pulse mt-4">
              Next request incoming...
            </div>
          )}
        </div>
      </div>

      {renderBookshelf()}
    </div>
  );

  const renderScene = () => {
    switch (scene) {
      case 'library': return renderLibrary();
      case 'request': return renderRequest();
      case 'creating': return renderCreating();
      case 'reveal': return renderReveal();
      case 'complete': return renderComplete();
      default: return null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {renderScene()}
    </div>
  );
};

export default StorybookGame;
