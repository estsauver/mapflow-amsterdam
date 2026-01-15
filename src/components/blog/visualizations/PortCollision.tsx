import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Du Bois color palette
const COLORS = {
  carmine: '#C41E3A',
  gold: '#DAA520',
  prussian: '#1E3A5F',
  emerald: '#2E8B57',
  ink: '#1A1A1A',
  charcoal: '#4A4A4A',
  parchment: '#E8DCC8',
  cream: '#F5F0E6',
  sepia: '#8B4513',
  burgundy: '#800020',
};

// Anthropic Claude logo
const ClaudeLogo: React.FC<{
  className?: string;
  mood?: 'neutral' | 'happy' | 'angry' | 'grabbing';
  flip?: boolean;
}> = ({ className = '', mood = 'neutral', flip = false }) => {
  const moodColors = {
    neutral: COLORS.gold,
    happy: COLORS.emerald,
    angry: COLORS.carmine,
    grabbing: COLORS.sepia,
  };

  return (
    <motion.div
      className={`relative ${className}`}
      animate={mood === 'angry' ? { rotate: [0, -5, 5, -5, 0] } : {}}
      transition={{ duration: 0.3, repeat: mood === 'angry' ? Infinity : 0 }}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* Anthropic Claude logo */}
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path
          d="M11.376 24L10.776 23.544L10.44 22.8L10.776 21.312L11.16 19.392L11.472 17.856L11.76 15.96L11.928 15.336L11.904 15.288L11.784 15.312L10.344 17.28L8.16 20.232L6.432 22.056L6.024 22.224L5.304 21.864L5.376 21.192L5.784 20.616L8.16 17.568L9.6 15.672L10.536 14.592L10.512 14.448H10.464L4.128 18.576L3 18.72L2.496 18.264L2.568 17.52L2.808 17.28L4.704 15.96L9.432 13.32L9.504 13.08L9.432 12.96H9.192L8.4 12.912L5.712 12.84L3.384 12.744L1.104 12.624L0.528 12.504L0 11.784L0.048 11.424L0.528 11.112L1.224 11.16L2.736 11.28L5.016 11.424L6.672 11.52L9.12 11.784H9.504L9.552 11.616L9.432 11.52L9.336 11.424L6.96 9.84L4.416 8.16L3.072 7.176L2.352 6.672L1.992 6.216L1.848 5.208L2.496 4.488L3.384 4.56L3.6 4.608L4.488 5.304L6.384 6.768L8.88 8.616L9.24 8.904L9.408 8.808V8.736L9.24 8.472L7.896 6.024L6.456 3.528L5.808 2.496L5.64 1.872C5.576 1.656 5.544 1.416 5.544 1.152L6.288 0.144001L6.696 0L7.704 0.144001L8.112 0.504001L8.736 1.92L9.72 4.152L11.28 7.176L11.736 8.088L11.976 8.904L12.072 9.168H12.24V9.024L12.36 7.296L12.6 5.208L12.84 2.52L12.912 1.752L13.296 0.840001L14.04 0.360001L14.616 0.624001L15.096 1.32L15.024 1.752L14.76 3.6L14.184 6.504L13.824 8.472H14.04L14.28 8.208L15.264 6.912L16.92 4.848L17.64 4.032L18.504 3.12L19.056 2.688H20.088L20.832 3.816L20.496 4.992L19.44 6.336L18.552 7.464L17.28 9.168L16.512 10.536L16.584 10.632H16.752L19.608 10.008L21.168 9.744L22.992 9.432L23.832 9.816L23.928 10.2L23.592 11.016L21.624 11.496L19.32 11.952L15.888 12.768L15.84 12.792L15.888 12.864L17.424 13.008L18.096 13.056H19.728L22.752 13.272L23.544 13.8L24 14.424L23.928 14.928L22.704 15.528L21.072 15.144L17.232 14.232L15.936 13.92H15.744V14.016L16.848 15.096L18.84 16.896L21.36 19.224L21.48 19.8L21.168 20.28L20.832 20.232L18.624 18.552L17.76 17.808L15.84 16.2H15.72V16.368L16.152 17.016L18.504 20.544L18.624 21.624L18.456 21.96L17.832 22.176L17.184 22.056L15.792 20.136L14.376 17.952L13.224 16.008L13.104 16.104L12.408 23.352L12.096 23.712L11.376 24Z"
          fill={moodColors[mood]}
          shapeRendering="optimizeQuality"
        />
      </svg>
    </motion.div>
  );
};

// Resource icons
const PortIcon: React.FC<{ grabbed?: 'left' | 'right' | null; conflict?: boolean }> = ({ grabbed, conflict }) => (
  <motion.div
    className={`
      relative w-10 h-10 flex items-center justify-center font-mono text-[10px] font-bold
      ${conflict ? 'bg-dubois-carmine/20 text-dubois-carmine border-2 border-dubois-carmine' : 'bg-dubois-cream text-dubois-ink border-2 border-dubois-ink'}
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
    <div className="w-8 h-10 bg-dubois-cream border-2 border-dubois-ink flex items-center justify-center">
      <svg className="w-4 h-4 text-dubois-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <span className="text-[8px] font-mono text-dubois-charcoal mt-0.5">{name}</span>
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
      relative w-12 h-10 flex items-center justify-center
      ${status === 'corrupted' ? 'bg-dubois-carmine/20 border-2 border-dubois-carmine' : 'bg-dubois-cream border-2 border-dubois-ink'}
    `}
    animate={status === 'dropping' ? { y: [0, 100], opacity: [1, 0] } : status === 'corrupted' ? { x: [-2, 2, -2] } : {}}
    transition={{ duration: status === 'dropping' ? 0.5 : 0.1, repeat: status === 'corrupted' ? Infinity : 0 }}
  >
    <svg className={`w-6 h-6 ${status === 'corrupted' ? 'text-dubois-carmine' : 'text-dubois-charcoal'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth={1.5} />
      <path strokeWidth={1.5} d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path strokeWidth={1.5} d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
    {status === 'corrupted' && (
      <div className="absolute -top-2 -right-2 text-sm">🔥</div>
    )}
    {status === 'dropping' && (
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-mono text-dubois-carmine whitespace-nowrap"
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
      px-2 py-1 text-[9px] font-mono whitespace-nowrap border-2 border-dubois-ink
      ${type === 'angry' ? 'bg-dubois-carmine/20 text-dubois-carmine' : 'bg-dubois-cream text-dubois-ink'}
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
    className="relative pt-8 pb-4 px-4 bg-dubois-prussian/10 border-2 border-dubois-prussian flex items-center justify-center"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring' }}
  >
    <div className="absolute -top-3 left-4 px-2 bg-dubois-parchment text-[10px] font-mono text-dubois-prussian">
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
      { phase: 'chaos1', duration: 2500 },
      { phase: 'chaos2', duration: 3000 },
      { phase: 'chaos3', duration: 3000 },
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
        <h4 className="dubois-heading text-sm text-dubois-charcoal">
          {isChaos ? '🔥 Shared Resources: Total Chaos 🔥' : phase === 'happy' ? '✨ Isolated Namespaces: Peace ✨' : 'The Isolation Problem'}
        </h4>
      </div>

      <AnimatePresence mode="wait">
        {/* Chaos Mode */}
        {(phase === 'idle' || isChaos) && (
          <motion.div
            key="chaos"
            className="relative bg-dubois-parchment border-2 border-dubois-carmine/30 p-6 min-h-[280px]"
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
                <span className="text-[10px] font-mono text-dubois-charcoal mt-1">Claude A</span>

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
                      className="text-[10px] font-mono text-dubois-carmine mt-1"
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
                    className="text-[10px] font-mono text-dubois-carmine text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div>A: DROP TABLE users</div>
                    <div>B: SELECT * FROM users</div>
                    <div className="text-dubois-burgundy font-bold">💀 CONFLICT 💀</div>
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
                <span className="text-[10px] font-mono text-dubois-charcoal mt-1">Claude B</span>

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
            className="flex items-center justify-center min-h-[280px] bg-dubois-parchment border-2 border-dubois-ink"
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
              <div className="dubois-heading text-dubois-gold text-sm">Creating namespaces...</div>
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
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-dubois-emerald whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    All mine! 😊
                  </motion.div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 bg-dubois-emerald/20 border-2 border-dubois-emerald flex items-center justify-center text-[8px] font-mono text-dubois-emerald">:3000</div>
                  <div className="w-6 h-7 bg-dubois-emerald/20 border-2 border-dubois-emerald flex items-center justify-center">
                    <svg className="w-3 h-3 text-dubois-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-8 h-7 bg-dubois-emerald/20 border-2 border-dubois-emerald flex items-center justify-center">
                    <svg className="w-4 h-4 text-dubois-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth={1.5} />
                      <path strokeWidth={1.5} d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                      <path strokeWidth={1.5} d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                    </svg>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-dubois-charcoal">Own port, files, DB</span>
              </div>
            </NamespaceBubble>

            {/* Claude B's namespace */}
            <NamespaceBubble name="worktree-feature">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <ClaudeLogo className="w-10 h-10" mood="happy" flip />
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-dubois-emerald whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    So peaceful! ✨
                  </motion.div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 bg-dubois-emerald/20 border-2 border-dubois-emerald flex items-center justify-center text-[8px] font-mono text-dubois-emerald">:3000</div>
                  <div className="w-6 h-7 bg-dubois-emerald/20 border-2 border-dubois-emerald flex items-center justify-center">
                    <svg className="w-3 h-3 text-dubois-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="w-8 h-7 bg-dubois-emerald/20 border-2 border-dubois-emerald flex items-center justify-center">
                    <svg className="w-4 h-4 text-dubois-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <ellipse cx="12" cy="5" rx="8" ry="3" strokeWidth={1.5} />
                      <path strokeWidth={1.5} d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
                      <path strokeWidth={1.5} d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
                    </svg>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-dubois-charcoal">Own port, files, DB</span>
              </div>
            </NamespaceBubble>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls - Du Bois styled */}
      <div className="flex justify-center mt-6">
        <div className={`
          flex items-center gap-2 px-4 py-2.5 bg-dubois-cream border-2 border-dubois-ink
          ${isPlaying ? 'opacity-60' : ''}
        `}>
          <span className="text-dubois-charcoal text-sm font-mono">
            {phase === 'happy'
              ? 'run it again, show me the chaos'
              : isPlaying
                ? 'watching the chaos unfold...'
                : 'go ahead, run all the claudes at once'}
          </span>

          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`
              ml-2 px-3 py-1.5 font-mono text-sm transition-all flex items-center gap-1.5 border-2 border-dubois-ink
              ${isPlaying
                ? 'bg-dubois-tan text-dubois-charcoal cursor-not-allowed'
                : 'bg-dubois-carmine hover:bg-dubois-burgundy text-dubois-warm-white'
              }
            `}
          >
            {isPlaying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-dubois-cream/30 border-t-dubois-cream rounded-full"
              />
            ) : (
              <>
                <span className="dubois-heading text-xs">{phase === 'happy' ? 'Replay' : 'Run'}</span>
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
        <p className="text-xs font-mono text-dubois-charcoal">
          {isChaos
            ? "Two Claudes, one port, one .env file, one database... disaster."
            : phase === 'happy'
              ? "Each Claude gets their own namespace with isolated resources."
              : "Click play to see what happens without isolation."
          }
        </p>
      </div>

      {/* Debug Controls */}
      {debugMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 bg-dubois-cream border-2 border-dubois-gold p-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-dubois-charcoal uppercase tracking-wider">Phase</span>
              <span className="font-mono text-dubois-gold font-bold">{phase}</span>
              <span className="text-[10px] text-dubois-charcoal">({PHASES.indexOf(phase) + 1}/{PHASES.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={stepBackward}
                disabled={PHASES.indexOf(phase) === 0}
                className="px-3 py-2 bg-dubois-parchment border-2 border-dubois-ink hover:bg-dubois-tan disabled:opacity-30 disabled:cursor-not-allowed text-dubois-ink font-mono text-sm flex items-center gap-1"
              >
                ← Prev
              </button>

              <button
                onClick={stepForward}
                disabled={PHASES.indexOf(phase) === PHASES.length - 1}
                className="px-3 py-2 bg-dubois-parchment border-2 border-dubois-ink hover:bg-dubois-tan disabled:opacity-30 disabled:cursor-not-allowed text-dubois-ink font-mono text-sm flex items-center gap-1"
              >
                Next →
              </button>
            </div>

            <div className="flex gap-1">
              {PHASES.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`
                    w-8 h-8 text-xs font-mono transition-all border-2 border-dubois-ink
                    ${phase === p
                      ? 'bg-dubois-gold text-dubois-ink font-bold'
                      : 'bg-dubois-cream text-dubois-charcoal hover:bg-dubois-tan'
                    }
                  `}
                  title={p}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setDebugMode(false)}
              className="px-2 py-1 bg-dubois-parchment border-2 border-dubois-ink hover:bg-dubois-tan text-dubois-charcoal text-xs"
            >
              ✕ Close
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default PortCollision;
