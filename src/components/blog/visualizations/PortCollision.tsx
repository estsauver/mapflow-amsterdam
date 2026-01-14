import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Anthropic logo as a cute little Claude
const ClaudeLogo: React.FC<{
  className?: string;
  mood?: 'neutral' | 'happy' | 'angry' | 'grabbing';
  flip?: boolean;
}> = ({ className = '', mood = 'neutral', flip = false }) => {
  const moodColors = {
    neutral: 'text-amber-400',
    happy: 'text-green-400',
    angry: 'text-red-400',
    grabbing: 'text-amber-500',
  };

  return (
    <motion.div
      className={`relative ${className} ${moodColors[mood]}`}
      animate={mood === 'angry' ? { rotate: [0, -5, 5, -5, 0] } : {}}
      transition={{ duration: 0.3, repeat: mood === 'angry' ? Infinity : 0 }}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* Anthropic-style logo - simplified sparkle/asterisk shape */}
      <svg viewBox="0 0 40 40" fill="currentColor" className="w-full h-full">
        <path d="M20 2 L22 15 L35 12 L24 20 L35 28 L22 25 L20 38 L18 25 L5 28 L16 20 L5 12 L18 15 Z" />
      </svg>
      {/* Eyes based on mood */}
      {mood === 'happy' && (
        <>
          <div className="absolute top-[35%] left-[30%] w-1.5 h-1.5 bg-slate-900 rounded-full" style={{ transform: 'rotate(-10deg) scaleY(0.5)' }} />
          <div className="absolute top-[35%] right-[30%] w-1.5 h-1.5 bg-slate-900 rounded-full" style={{ transform: 'rotate(10deg) scaleY(0.5)' }} />
        </>
      )}
      {mood === 'angry' && (
        <>
          <div className="absolute top-[32%] left-[28%] w-2 h-0.5 bg-slate-900 rounded-full" style={{ transform: 'rotate(-20deg)' }} />
          <div className="absolute top-[32%] right-[28%] w-2 h-0.5 bg-slate-900 rounded-full" style={{ transform: 'rotate(20deg)' }} />
        </>
      )}
    </motion.div>
  );
};

// Resource icons
const PortIcon: React.FC<{ grabbed?: 'left' | 'right' | null; conflict?: boolean }> = ({ grabbed, conflict }) => (
  <motion.div
    className={`
      relative w-10 h-10 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold
      ${conflict ? 'bg-red-500/30 text-red-400 border-2 border-red-500' : 'bg-slate-700 text-slate-300 border border-slate-600'}
    `}
    animate={conflict ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
    transition={{ duration: 0.3, repeat: conflict ? 3 : 0 }}
  >
    :3000
    {conflict && (
      <motion.div
        className="absolute -top-1 -right-1 text-lg"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.2, repeat: Infinity }}
      >
        💥
      </motion.div>
    )}
  </motion.div>
);

const FileIcon: React.FC<{ name: string; beingLassoed?: 'left' | 'right' | null }> = ({ name, beingLassoed }) => (
  <motion.div
    className="relative flex flex-col items-center"
    animate={beingLassoed ? { x: beingLassoed === 'left' ? -20 : 20, rotate: beingLassoed === 'left' ? -15 : 15 } : {}}
    transition={{ type: 'spring', stiffness: 200 }}
  >
    <div className="w-8 h-10 bg-slate-700 rounded border border-slate-600 flex items-center justify-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <span className="text-[8px] font-mono text-slate-500 mt-0.5">{name}</span>
    {beingLassoed && (
      <motion.div
        className="absolute -top-2 text-xs"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1, rotate: [0, 360] }}
        transition={{ rotate: { duration: 0.5, repeat: Infinity, ease: 'linear' } }}
      >
        🤠
      </motion.div>
    )}
  </motion.div>
);

const DatabaseIcon: React.FC<{ status: 'normal' | 'dropping' | 'corrupted' }> = ({ status }) => (
  <motion.div
    className={`
      relative w-12 h-10 rounded flex items-center justify-center
      ${status === 'corrupted' ? 'bg-red-500/30 border-2 border-red-500' : 'bg-slate-700 border border-slate-600'}
    `}
    animate={status === 'dropping' ? { y: [0, 100], opacity: [1, 0] } : status === 'corrupted' ? { x: [-2, 2, -2] } : {}}
    transition={{ duration: status === 'dropping' ? 0.5 : 0.1, repeat: status === 'corrupted' ? Infinity : 0 }}
  >
    <svg className={`w-6 h-6 ${status === 'corrupted' ? 'text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth={1.5} />
      <path strokeWidth={1.5} d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path strokeWidth={1.5} d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
    {status === 'corrupted' && (
      <div className="absolute -top-2 -right-2 text-sm">🔥</div>
    )}
    {status === 'dropping' && (
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-mono text-red-400 whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        DROP TABLE
      </motion.div>
    )}
  </motion.div>
);

// Speech bubble for Claude actions
const ActionBubble: React.FC<{ text: string; side: 'left' | 'right'; type?: 'normal' | 'angry' }> = ({ text, side, type = 'normal' }) => (
  <motion.div
    className={`
      absolute ${side === 'left' ? 'left-0' : 'right-0'} -top-8
      px-2 py-1 rounded text-[9px] font-mono whitespace-nowrap
      ${type === 'angry' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}
    `}
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
  >
    {text}
  </motion.div>
);

// Namespace bubble for isolated mode
const NamespaceBubble: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
  <motion.div
    className="relative pt-8 pb-4 px-4 rounded-xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring' }}
  >
    <div className="absolute -top-3 left-4 px-2 bg-slate-950 text-[10px] font-mono text-cyan-400">
      {name}
    </div>
    {children}
  </motion.div>
);

type Phase = 'idle' | 'chaos1' | 'chaos2' | 'chaos3' | 'transition' | 'happy';

const PHASES: Phase[] = ['idle', 'chaos1', 'chaos2', 'chaos3', 'transition', 'happy'];

export const PortCollision: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Expose debug functions on window for easy console access
  useEffect(() => {
    (window as any).__portCollision = {
      setPhase,
      phases: PHASES,
      getPhase: () => phase,
    };
    return () => {
      delete (window as any).__portCollision;
    };
  }, [phase]);

  useEffect(() => {
    if (!isPlaying || debugMode) return;

    const sequence: { phase: Phase; duration: number }[] = [
      { phase: 'chaos1', duration: 2500 },  // Both grab port - slower
      { phase: 'chaos2', duration: 3000 },  // Lasso files - slower
      { phase: 'chaos3', duration: 3000 },  // Database chaos - slower
      { phase: 'transition', duration: 1500 },
      { phase: 'happy', duration: 3000 },
    ];

    let currentIndex = 0;
    const runSequence = () => {
      if (currentIndex >= sequence.length) {
        setIsPlaying(false);
        return;
      }

      setPhase(sequence[currentIndex].phase);
      setTimeout(() => {
        currentIndex++;
        runSequence();
      }, sequence[currentIndex].duration);
    };

    runSequence();
  }, [isPlaying, debugMode]);

  const handlePlay = () => {
    setPhase('idle');
    setIsPlaying(true);
  };

  const handleReset = () => {
    setPhase('idle');
    setIsPlaying(false);
  };

  // Debug step functions
  const stepForward = () => {
    const currentIndex = PHASES.indexOf(phase);
    if (currentIndex < PHASES.length - 1) {
      setPhase(PHASES[currentIndex + 1]);
    }
  };

  const stepBackward = () => {
    const currentIndex = PHASES.indexOf(phase);
    if (currentIndex > 0) {
      setPhase(PHASES[currentIndex - 1]);
    }
  };

  const isChaos = phase === 'chaos1' || phase === 'chaos2' || phase === 'chaos3';

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h4 className="font-mono text-sm text-slate-400">
          {isChaos ? '🔥 Shared Resources: Total Chaos 🔥' : phase === 'happy' ? '✨ Isolated Namespaces: Peace ✨' : 'The Isolation Problem'}
        </h4>
      </div>

      <AnimatePresence mode="wait">
        {/* Chaos Mode */}
        {(phase === 'idle' || isChaos) && (
          <motion.div
            key="chaos"
            className="relative bg-slate-900/50 rounded-xl p-6 border border-red-500/20 min-h-[280px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {/* Battlefield */}
            <div className="relative flex justify-between items-center">
              {/* Left Claude */}
              <div className="relative flex flex-col items-center">
                <AnimatePresence>
                  {phase === 'chaos1' && <ActionBubble text="MINE! npm run dev" side="left" type="angry" />}
                  {phase === 'chaos2' && <ActionBubble text="*lassoing* config.json" side="left" />}
                  {phase === 'chaos3' && <ActionBubble text="DROP TABLE users;" side="left" type="angry" />}
                </AnimatePresence>
                <ClaudeLogo
                  className="w-12 h-12"
                  mood={isChaos ? 'angry' : 'neutral'}
                />
                <span className="text-[10px] font-mono text-slate-500 mt-1">Claude A</span>

                {/* Left Claude's reaching arm for port */}
                {phase === 'chaos1' && (
                  <motion.div
                    className="absolute top-4 -right-8 text-2xl"
                    initial={{ x: 0 }}
                    animate={{ x: 60, rotate: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    👋
                  </motion.div>
                )}
              </div>

              {/* Shared Resources in the middle */}
              <div className="flex flex-col items-center gap-4 pt-8">
                {/* Port */}
                <div className="flex flex-col items-center">
                  <PortIcon conflict={phase === 'chaos1'} />
                  {phase === 'chaos1' && (
                    <motion.span
                      className="text-[10px] font-mono text-red-400 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      EADDRINUSE!
                    </motion.span>
                  )}
                </div>

                {/* Files */}
                <div className="flex gap-2">
                  <FileIcon name=".env" beingLassoed={phase === 'chaos2' ? 'left' : null} />
                  <FileIcon name="config" beingLassoed={phase === 'chaos2' ? 'right' : null} />
                </div>

                {/* Database */}
                <DatabaseIcon status={phase === 'chaos3' ? 'corrupted' : 'normal'} />
                {phase === 'chaos3' && (
                  <motion.div
                    className="text-[10px] font-mono text-red-400 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div>A: DROP TABLE users</div>
                    <div>B: SELECT * FROM users</div>
                    <div className="text-red-500 font-bold">💀 CONFLICT 💀</div>
                  </motion.div>
                )}
              </div>

              {/* Right Claude */}
              <div className="relative flex flex-col items-center">
                <AnimatePresence>
                  {phase === 'chaos1' && <ActionBubble text="NO, MINE!" side="right" type="angry" />}
                  {phase === 'chaos2' && <ActionBubble text="I need that file!" side="right" />}
                  {phase === 'chaos3' && <ActionBubble text="SELECT * FROM... 😱" side="right" type="angry" />}
                </AnimatePresence>
                <ClaudeLogo
                  className="w-12 h-12"
                  mood={isChaos ? 'angry' : 'neutral'}
                  flip
                />
                <span className="text-[10px] font-mono text-slate-500 mt-1">Claude B</span>

                {/* Right Claude's reaching arm for port */}
                {phase === 'chaos1' && (
                  <motion.div
                    className="absolute top-4 -left-8 text-2xl"
                    initial={{ x: 0 }}
                    animate={{ x: -60, rotate: -20 }}
                    transition={{ duration: 0.3 }}
                    style={{ transform: 'scaleX(-1)' }}
                  >
                    👋
                  </motion.div>
                )}
              </div>
            </div>

          </motion.div>
        )}

        {/* Transition */}
        {phase === 'transition' && (
          <motion.div
            key="transition"
            className="flex items-center justify-center min-h-[280px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <div className="text-4xl mb-2">🏗️</div>
              <div className="font-mono text-amber-400 text-sm">Creating namespaces...</div>
            </motion.div>
          </motion.div>
        )}

        {/* Happy Isolated Mode */}
        {phase === 'happy' && (
          <motion.div
            key="happy"
            className="grid grid-cols-2 gap-6 min-h-[280px] items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Claude A's namespace */}
            <NamespaceBubble name="worktree-main">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <ClaudeLogo className="w-10 h-10" mood="happy" />
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-green-400 whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    All mine! 😊
                  </motion.div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[8px] font-mono text-green-400">:3000</div>
                  <div className="w-6 h-7 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-8 h-7 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth={1.5} />
                      <path strokeWidth={1.5} d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                      <path strokeWidth={1.5} d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                    </svg>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-500">Own port, files, DB</span>
              </div>
            </NamespaceBubble>

            {/* Claude B's namespace */}
            <NamespaceBubble name="worktree-feature">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <ClaudeLogo className="w-10 h-10" mood="happy" flip />
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-green-400 whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    So peaceful! ✨
                  </motion.div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[8px] font-mono text-green-400">:3000</div>
                  <div className="w-6 h-7 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-8 h-7 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth={1.5} />
                      <path strokeWidth={1.5} d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                      <path strokeWidth={1.5} d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                    </svg>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-slate-500">Own port, files, DB</span>
              </div>
            </NamespaceBubble>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls - Claude Code style prompt */}
      <div className="flex justify-center mt-6">
        <div className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50
          ${isPlaying ? 'opacity-60' : ''}
        `}>
          {/* Prompt text */}
          <span className="text-slate-400 text-sm font-mono">
            {phase === 'happy'
              ? 'run it again, show me the chaos'
              : isPlaying
                ? 'watching the chaos unfold...'
                : 'go ahead, run all the claudes at once'}
          </span>

          {/* Submit button - Claude Code style */}
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`
              ml-2 px-3 py-1.5 rounded-lg font-mono text-sm transition-all flex items-center gap-1.5
              ${isPlaying
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-[#E07A5F] hover:bg-[#D4694E] text-white'
              }
            `}
          >
            {isPlaying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <span>{phase === 'happy' ? 'Replay' : 'Run'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 text-center">
        <p className="text-xs font-mono text-slate-500">
          {isChaos
            ? "Two Claudes, one port, one .env file, one database... disaster."
            : phase === 'happy'
              ? "Each Claude gets their own namespace with isolated resources."
              : "Click play to see what happens without isolation."
          }
        </p>
      </div>

      {/* Debug Controls - inline version */}
      {debugMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 bg-slate-900/50 border border-amber-500/30 rounded-xl p-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Phase indicator */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Phase</span>
              <span className="font-mono text-amber-400 font-bold">{phase}</span>
              <span className="text-[10px] text-slate-600">({PHASES.indexOf(phase) + 1}/{PHASES.length})</span>
            </div>

            {/* Step controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={stepBackward}
                disabled={PHASES.indexOf(phase) === 0}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono text-sm flex items-center gap-1"
              >
                ← Prev
              </button>

              <button
                onClick={stepForward}
                disabled={PHASES.indexOf(phase) === PHASES.length - 1}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-mono text-sm flex items-center gap-1"
              >
                Next →
              </button>
            </div>

            {/* Phase quick-jump */}
            <div className="flex gap-1">
              {PHASES.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`
                    w-8 h-8 rounded text-xs font-mono transition-all
                    ${phase === p
                      ? 'bg-amber-500 text-slate-900 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }
                  `}
                  title={p}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setDebugMode(false)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
            >
              ✕ Close
            </button>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-500 font-mono flex gap-4 justify-center">
            <span>← → step</span>
            <span>1-6 jump</span>
            <span>d toggle</span>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default PortCollision;
