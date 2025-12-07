import React, { useState, useEffect } from 'react';

type GameScene = 'library' | 'request' | 'creating' | 'reveal' | 'complete';

interface BookRequest {
  childName: string;
  request: string;
  bookTitle: string;
  bookCover: string;
  storyPreview: string;
}

const BOOK_REQUESTS: BookRequest[] = [
  {
    childName: 'Emma',
    request: 'I want a book about a dinosaur construction worker!',
    bookTitle: 'Dino Builds a House',
    bookCover: '🦕🏗️',
    storyPreview: 'Terry the T-Rex loved building things...',
  },
  {
    childName: 'Marcus',
    request: 'Can I have a story about a princess who flies rockets?',
    bookTitle: 'Princess Starlight',
    bookCover: '👸🚀',
    storyPreview: 'Princess Nova dreamed of the stars...',
  },
  {
    childName: 'Sofia',
    request: 'I want a book about a bunny who bakes cookies!',
    bookTitle: 'Benny\'s Bakery',
    bookCover: '🐰🍪',
    storyPreview: 'In a cozy burrow, Benny mixed the dough...',
  },
];

const StorybookGame: React.FC = () => {
  const [scene, setScene] = useState<GameScene>('library');
  const [currentRequestIndex, setCurrentRequestIndex] = useState(0);
  const [typedRequest, setTypedRequest] = useState('');
  const [showRobot, setShowRobot] = useState(true);
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
      // Stay on complete for the last one
    }, 2500);
    return () => clearTimeout(timeout);
  }, [scene, currentRequestIndex]);

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
      {/* Arms holding book/paper */}
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
        {/* Existing books on shelf */}
        {[...Array(booksCreated)].map((_, i) => (
          <div
            key={i}
            className="w-8 h-20 rounded-t-sm"
            style={{
              background: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i % 4],
              transform: `rotate(${Math.random() * 6 - 3}deg)`,
            }}
          />
        ))}
        {/* Empty spaces */}
        {[...Array(Math.max(0, 8 - booksCreated))].map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-20 opacity-0" />
        ))}
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="h-full flex flex-col items-center justify-center relative">
      {/* Library background */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 to-amber-200" />

      {/* Bookshelves background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(3)].map((_, row) => (
          <div key={row} className="flex justify-around mt-8">
            {[...Array(8)].map((_, col) => (
              <div
                key={col}
                className="w-6 h-16 bg-amber-800 rounded-t-sm"
                style={{ opacity: 0.3 + Math.random() * 0.4 }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center">
        {renderRobot(true)}
        <div className="mt-8 bg-white/90 rounded-xl px-8 py-4 shadow-lg">
          <div className="text-amber-800 font-serif text-2xl">
            ✨ The Story Machine ✨
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
        {/* Child avatar */}
        <div className="flex items-end gap-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-amber-300 to-amber-400 flex items-center justify-center text-4xl mb-2">
              👧
            </div>
            <div className="font-serif text-amber-800">{currentRequest.childName}</div>
          </div>

          {/* Speech bubble */}
          <div className="relative bg-white rounded-2xl px-6 py-4 shadow-lg max-w-md">
            <div className="absolute -left-4 bottom-4 w-0 h-0 border-t-[10px] border-t-transparent border-r-[20px] border-r-white border-b-[10px] border-b-transparent" />
            <div className="font-serif text-amber-900 text-lg">
              "{typedRequest}"
              <span className="animate-pulse">|</span>
            </div>
          </div>
        </div>

        {/* Robot listening */}
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

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute text-2xl animate-ping"
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
        >
          ✨
        </div>
      ))}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Robot working */}
        <div className="mb-8">
          {renderRobot(true)}
        </div>

        {/* Transformation animation */}
        <div className="relative w-48 h-64">
          {/* Blank paper transforming into book */}
          <div
            className={`absolute inset-0 bg-white rounded-lg shadow-2xl transition-all duration-500 ${
              creatingPhase >= 1 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transform: creatingPhase >= 2 ? 'rotateY(10deg)' : 'rotateY(0deg)',
              boxShadow: creatingPhase >= 3 ? '0 0 60px rgba(168, 85, 247, 0.8)' : '0 0 20px rgba(255,255,255,0.3)',
            }}
          >
            {/* Text appearing */}
            {creatingPhase >= 2 && (
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
            {/* Cover forming */}
            {creatingPhase >= 4 && (
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="text-6xl">{currentRequest.bookCover}</div>
              </div>
            )}
          </div>
        </div>

        {/* Status text */}
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
        {/* The completed book */}
        <div
          className="relative w-56 h-72 rounded-lg shadow-2xl transform hover:scale-105 transition-transform animate-bounce"
          style={{
            background: 'linear-gradient(135deg, #f43f5e, #a855f7)',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
          }}
        >
          {/* Book spine effect */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-black/20 rounded-l-lg" />

          {/* Cover content */}
          <div className="flex flex-col items-center justify-center h-full text-white">
            <div className="text-6xl mb-4">{currentRequest.bookCover}</div>
            <div className="text-xl font-bold text-center px-4 font-serif">
              {currentRequest.bookTitle}
            </div>
          </div>
        </div>

        {/* Preview snippet */}
        <div className="mt-8 bg-white/90 rounded-xl px-6 py-4 shadow-lg max-w-md">
          <div className="text-amber-800 font-serif italic">
            "{currentRequest.storyPreview}"
          </div>
        </div>

        {/* Robot presenting */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-4xl">🤖</div>
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
          <div className="text-6xl mb-4">📚</div>
          <div className="text-amber-800 font-serif text-2xl mb-2">
            Books Created: {booksCreated}
          </div>
          {currentRequestIndex >= BOOK_REQUESTS.length - 1 && (
            <>
              <div className="text-amber-600 font-serif mt-4">
                Every child's imagination deserves a story.
              </div>
              <div className="mt-8 space-y-2">
                <div className="text-purple-600 font-mono text-sm">
                  📖 PROJECT UNNAMED
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
      case 'library':
        return renderLibrary();
      case 'request':
        return renderRequest();
      case 'creating':
        return renderCreating();
      case 'reveal':
        return renderReveal();
      case 'complete':
        return renderComplete();
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {renderScene()}
    </div>
  );
};

export default StorybookGame;
