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

// The evolving shape - from blob to refined visualization
const EvolvingShape: React.FC<{ stage: number; isMoving: boolean }> = ({ stage, isMoving }) => {
  // Stage 0: Amorphous blob
  // Stage 1: Slightly more defined blob
  // Stage 2: Rough rectangles emerging
  // Stage 3: Clear bar chart shape
  // Stage 4: Polished bar chart with details
  // Stage 5: Animated, colorful final visualization

  const getShapeContent = () => {
    switch (stage) {
      case 0:
        // Initial amorphous blob
        return (
          <motion.svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.path
              d="M50,20 C70,15 85,30 80,50 C85,70 70,85 50,80 C30,85 15,70 20,50 C15,30 30,15 50,20"
              fill={COLORS.charcoal}
              animate={{
                d: [
                  "M50,20 C70,15 85,30 80,50 C85,70 70,85 50,80 C30,85 15,70 20,50 C15,30 30,15 50,20",
                  "M50,15 C75,20 90,35 85,55 C80,75 65,85 45,85 C25,80 10,65 15,45 C20,25 35,10 50,15",
                  "M55,18 C72,18 88,32 82,52 C88,72 72,88 52,82 C32,88 18,72 22,52 C18,32 32,18 55,18",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              opacity={0.7}
            />
          </motion.svg>
        );

      case 1:
        // Slightly more defined blob with hints of structure
        return (
          <motion.svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.path
              d="M25,70 Q25,30 35,30 Q40,25 45,30 Q50,20 55,30 Q60,25 65,30 Q75,30 75,70 Q75,80 50,80 Q25,80 25,70"
              fill={COLORS.charcoal}
              animate={{
                d: [
                  "M25,70 Q25,30 35,30 Q40,25 45,30 Q50,20 55,30 Q60,25 65,30 Q75,30 75,70 Q75,80 50,80 Q25,80 25,70",
                  "M25,70 Q23,35 35,35 Q42,28 45,32 Q50,18 55,28 Q58,22 65,32 Q77,35 75,70 Q75,82 50,82 Q25,82 25,70",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              opacity={0.8}
            />
          </motion.svg>
        );

      case 2:
        // Rough rectangles emerging
        return (
          <motion.svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.rect x="18" y="45" width="12" height="30" fill={COLORS.prussian} rx="3"
              animate={{ y: [45, 42, 45], height: [30, 33, 30] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
            <motion.rect x="34" y="30" width="12" height="45" fill={COLORS.prussian} rx="3"
              animate={{ y: [30, 27, 30], height: [45, 48, 45] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
            <motion.rect x="50" y="40" width="12" height="35" fill={COLORS.prussian} rx="3"
              animate={{ y: [40, 37, 40], height: [35, 38, 35] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
            <motion.rect x="66" y="25" width="12" height="50" fill={COLORS.prussian} rx="3"
              animate={{ y: [25, 22, 25], height: [50, 53, 50] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} />
            {/* Base line, wobbly */}
            <motion.line x1="15" y1="78" x2="85" y2="78" stroke={COLORS.charcoal} strokeWidth="2"
              animate={{ y1: [78, 79, 78], y2: [78, 77, 78] }}
              transition={{ duration: 1, repeat: Infinity }} />
          </motion.svg>
        );

      case 3:
        // Clear bar chart shape with labels starting to appear
        return (
          <motion.svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Y-axis */}
            <line x1="18" y1="20" x2="18" y2="78" stroke={COLORS.charcoal} strokeWidth="1.5" />
            {/* X-axis */}
            <line x1="18" y1="78" x2="88" y2="78" stroke={COLORS.charcoal} strokeWidth="1.5" />
            {/* Bars */}
            <motion.rect x="24" y="48" width="10" height="28" fill={COLORS.prussian}
              initial={{ height: 0, y: 76 }}
              animate={{ height: 28, y: 48 }}
              transition={{ duration: 0.4 }} />
            <motion.rect x="38" y="32" width="10" height="44" fill={COLORS.prussian}
              initial={{ height: 0, y: 76 }}
              animate={{ height: 44, y: 32 }}
              transition={{ duration: 0.4, delay: 0.1 }} />
            <motion.rect x="52" y="42" width="10" height="34" fill={COLORS.prussian}
              initial={{ height: 0, y: 76 }}
              animate={{ height: 34, y: 42 }}
              transition={{ duration: 0.4, delay: 0.2 }} />
            <motion.rect x="66" y="26" width="10" height="50" fill={COLORS.prussian}
              initial={{ height: 0, y: 76 }}
              animate={{ height: 50, y: 26 }}
              transition={{ duration: 0.4, delay: 0.3 }} />
            <motion.rect x="80" y="38" width="10" height="38" fill={COLORS.prussian}
              initial={{ height: 0, y: 76 }}
              animate={{ height: 38, y: 38 }}
              transition={{ duration: 0.4, delay: 0.4 }} />
            {/* Label hints */}
            <motion.text x="29" y="86" fontSize="6" fill={COLORS.charcoal} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.5 }}>
              J
            </motion.text>
            <motion.text x="43" y="86" fontSize="6" fill={COLORS.charcoal} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.6 }}>
              F
            </motion.text>
            <motion.text x="57" y="86" fontSize="6" fill={COLORS.charcoal} textAnchor="middle"
              initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.7 }}>
              M
            </motion.text>
          </motion.svg>
        );

      case 4:
        // Polished bar chart
        return (
          <motion.svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Y-axis */}
            <line x1="18" y1="15" x2="18" y2="78" stroke={COLORS.ink} strokeWidth="1.5" />
            {/* X-axis */}
            <line x1="18" y1="78" x2="92" y2="78" stroke={COLORS.ink} strokeWidth="1.5" />
            {/* Y-axis ticks */}
            <line x1="15" y1="25" x2="18" y2="25" stroke={COLORS.ink} strokeWidth="1" />
            <line x1="15" y1="50" x2="18" y2="50" stroke={COLORS.ink} strokeWidth="1" />
            <text x="13" y="27" fontSize="5" fill={COLORS.charcoal} textAnchor="end">100</text>
            <text x="13" y="52" fontSize="5" fill={COLORS.charcoal} textAnchor="end">50</text>
            {/* Title */}
            <text x="55" y="10" fontSize="6" fill={COLORS.ink} textAnchor="middle" fontWeight="bold">Monthly Metrics</text>
            {/* Bars with different colors */}
            <motion.rect x="24" y="48" width="10" height="28" fill={COLORS.carmine}
              whileHover={{ y: 46, height: 30 }} />
            <motion.rect x="38" y="32" width="10" height="44" fill={COLORS.gold}
              whileHover={{ y: 30, height: 46 }} />
            <motion.rect x="52" y="42" width="10" height="34" fill={COLORS.prussian}
              whileHover={{ y: 40, height: 36 }} />
            <motion.rect x="66" y="26" width="10" height="50" fill={COLORS.emerald}
              whileHover={{ y: 24, height: 52 }} />
            <motion.rect x="80" y="38" width="10" height="38" fill={COLORS.sepia}
              whileHover={{ y: 36, height: 40 }} />
            {/* X-axis labels */}
            <text x="29" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Jan</text>
            <text x="43" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Feb</text>
            <text x="57" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Mar</text>
            <text x="71" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Apr</text>
            <text x="85" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">May</text>
          </motion.svg>
        );

      case 5:
        // Final animated visualization
        return (
          <motion.svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Y-axis */}
            <line x1="18" y1="15" x2="18" y2="78" stroke={COLORS.ink} strokeWidth="1.5" />
            {/* X-axis */}
            <line x1="18" y1="78" x2="92" y2="78" stroke={COLORS.ink} strokeWidth="1.5" />
            {/* Grid lines */}
            <line x1="18" y1="50" x2="92" y2="50" stroke={COLORS.charcoal} strokeWidth="0.5" strokeDasharray="2" opacity={0.3} />
            <line x1="18" y1="25" x2="92" y2="25" stroke={COLORS.charcoal} strokeWidth="0.5" strokeDasharray="2" opacity={0.3} />
            {/* Y-axis ticks */}
            <line x1="15" y1="25" x2="18" y2="25" stroke={COLORS.ink} strokeWidth="1" />
            <line x1="15" y1="50" x2="18" y2="50" stroke={COLORS.ink} strokeWidth="1" />
            <text x="13" y="27" fontSize="5" fill={COLORS.charcoal} textAnchor="end">100</text>
            <text x="13" y="52" fontSize="5" fill={COLORS.charcoal} textAnchor="end">50</text>
            {/* Title */}
            <text x="55" y="10" fontSize="6" fill={COLORS.ink} textAnchor="middle" fontWeight="bold">Monthly Metrics</text>
            {/* Animated bars */}
            <motion.rect x="24" y="48" width="10" height="28" fill={COLORS.carmine}
              animate={{ y: [48, 46, 48] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
            <motion.rect x="38" y="32" width="10" height="44" fill={COLORS.gold}
              animate={{ y: [32, 30, 32] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
            <motion.rect x="52" y="42" width="10" height="34" fill={COLORS.prussian}
              animate={{ y: [42, 40, 42] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
            <motion.rect x="66" y="26" width="10" height="50" fill={COLORS.emerald}
              animate={{ y: [26, 24, 26] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} />
            <motion.rect x="80" y="38" width="10" height="38" fill={COLORS.sepia}
              animate={{ y: [38, 36, 38] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }} />
            {/* X-axis labels */}
            <text x="29" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Jan</text>
            <text x="43" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Feb</text>
            <text x="57" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Mar</text>
            <text x="71" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">Apr</text>
            <text x="85" y="86" fontSize="5" fill={COLORS.ink} textAnchor="middle">May</text>
            {/* Sparkle effect */}
            <motion.circle cx="71" cy="22" r="2" fill={COLORS.gold}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} />
          </motion.svg>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      className="w-24 h-24 md:w-32 md:h-32"
      animate={isMoving ? {
        scale: [1, 0.9, 1.1, 1],
        rotate: [0, -5, 5, 0],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {getShapeContent()}
    </motion.div>
  );
};

// Human icon
const HumanIcon: React.FC<{ className?: string; isActive?: boolean }> = ({ className = '', isActive }) => (
  <motion.div
    className={`w-12 h-12 md:w-16 md:h-16 bg-dubois-gold flex items-center justify-center ${className}`}
    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 0.3 }}
  >
    <svg className="w-6 h-6 md:w-8 md:h-8 text-dubois-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  </motion.div>
);

// Claude icon
const ClaudeIcon: React.FC<{ className?: string; isActive?: boolean }> = ({ className = '', isActive }) => (
  <motion.div
    className={`w-12 h-12 md:w-16 md:h-16 bg-dubois-prussian flex items-center justify-center ${className}`}
    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
    transition={{ duration: 0.3 }}
  >
    <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-9 md:h-9">
      <path
        d="M11.376 24L10.776 23.544L10.44 22.8L10.776 21.312L11.16 19.392L11.472 17.856L11.76 15.96L11.928 15.336L11.904 15.288L11.784 15.312L10.344 17.28L8.16 20.232L6.432 22.056L6.024 22.224L5.304 21.864L5.376 21.192L5.784 20.616L8.16 17.568L9.6 15.672L10.536 14.592L10.512 14.448H10.464L4.128 18.576L3 18.72L2.496 18.264L2.568 17.52L2.808 17.28L4.704 15.96L9.432 13.32L9.504 13.08L9.432 12.96H9.192L8.4 12.912L5.712 12.84L3.384 12.744L1.104 12.624L0.528 12.504L0 11.784L0.048 11.424L0.528 11.112L1.224 11.16L2.736 11.28L5.016 11.424L6.672 11.52L9.12 11.784H9.504L9.552 11.616L9.432 11.52L9.336 11.424L6.96 9.84L4.416 8.16L3.072 7.176L2.352 6.672L1.992 6.216L1.848 5.208L2.496 4.488L3.384 4.56L3.6 4.608L4.488 5.304L6.384 6.768L8.88 8.616L9.24 8.904L9.408 8.808V8.736L9.24 8.472L7.896 6.024L6.456 3.528L5.808 2.496L5.64 1.872C5.576 1.656 5.544 1.416 5.544 1.152L6.288 0.144001L6.696 0L7.704 0.144001L8.112 0.504001L8.736 1.92L9.72 4.152L11.28 7.176L11.736 8.088L11.976 8.904L12.072 9.168H12.24V9.024L12.36 7.296L12.6 5.208L12.84 2.52L12.912 1.752L13.296 0.840001L14.04 0.360001L14.616 0.624001L15.096 1.32L15.024 1.752L14.76 3.6L14.184 6.504L13.824 8.472H14.04L14.28 8.208L15.264 6.912L16.92 4.848L17.64 4.032L18.504 3.12L19.056 2.688H20.088L20.832 3.816L20.496 4.992L19.44 6.336L18.552 7.464L17.28 9.168L16.512 10.536L16.584 10.632H16.752L19.608 10.008L21.168 9.744L22.992 9.432L23.832 9.816L23.928 10.2L23.592 11.016L21.624 11.496L19.32 11.952L15.888 12.768L15.84 12.792L15.888 12.864L17.424 13.008L18.096 13.056H19.728L22.752 13.272L23.544 13.8L24 14.424L23.928 14.928L22.704 15.528L21.072 15.144L17.232 14.232L15.936 13.92H15.744V14.016L16.848 15.096L18.84 16.896L21.36 19.224L21.48 19.8L21.168 20.28L20.832 20.232L18.624 18.552L17.76 17.808L15.84 16.2H15.72V16.368L16.152 17.016L18.504 20.544L18.624 21.624L18.456 21.96L17.832 22.176L17.184 22.056L15.792 20.136L14.376 17.952L13.224 16.008L13.104 16.104L12.408 23.352L12.096 23.712L11.376 24Z"
        fill={COLORS.cream}
      />
    </svg>
  </motion.div>
);

// Feedback labels for each stage
const STAGE_INFO = [
  { human: '"Here\'s a rough idea..."', claude: 'Starting with a basic shape' },
  { human: '"Can we add some structure?"', claude: 'Defining the outline...' },
  { human: '"Make it look like a chart"', claude: 'Forming bars...' },
  { human: '"Add labels and context"', claude: 'Adding axes and text...' },
  { human: '"Polish it up"', claude: 'Refining colors and details...' },
  { human: '"Ship it!"', claude: 'Adding final animations!' },
];

export const BuildLoop: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [position, setPosition] = useState<'human' | 'center' | 'claude'>('human');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const hasAppeared = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      hasAppeared.current = true;
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    // Animation sequence: human -> claude -> human -> claude...
    // Each exchange advances the stage
    const sequence = async () => {
      for (let i = stage; i <= 5; i++) {
        // Move to center from human
        setIsMoving(true);
        setPosition('center');
        await new Promise(r => setTimeout(r, 400));

        // Move to Claude
        setPosition('claude');
        await new Promise(r => setTimeout(r, 400));
        setIsMoving(false);

        // Claude "works" on it
        await new Promise(r => setTimeout(r, 800));

        // Advance stage (Claude improved it)
        if (i < 5) {
          setStage(i + 1);
        }

        // Move back to center
        setIsMoving(true);
        setPosition('center');
        await new Promise(r => setTimeout(r, 400));

        // Move to human
        setPosition('human');
        await new Promise(r => setTimeout(r, 400));
        setIsMoving(false);

        // Human reviews
        await new Promise(r => setTimeout(r, 600));

        if (i === 5) {
          setIsPlaying(false);
          break;
        }
      }
    };

    sequence();
  }, [isPlaying]);

  const handlePlay = () => {
    setStage(0);
    setPosition('human');
    setIsPlaying(true);
  };

  const getPositionX = () => {
    switch (position) {
      case 'human': return 'translateX(0%)';
      case 'center': return 'translateX(calc(50vw - 50% - 1rem))';
      case 'claude': return 'translateX(calc(100% + 4rem))';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h4 className="dubois-heading text-sm text-dubois-charcoal">
          The Build Loop
        </h4>
        <p className="text-xs text-dubois-charcoal mt-1 font-mono">
          From blob to visualization, one exchange at a time
        </p>
      </div>

      {/* Stage indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => {
              if (!isPlaying) {
                setStage(s);
                setPosition('human');
              }
            }}
            disabled={isPlaying}
            className={`
              w-8 h-8 flex items-center justify-center font-mono text-sm border-2 transition-all
              ${s === stage
                ? 'bg-dubois-carmine border-dubois-carmine text-dubois-cream'
                : s < stage
                  ? 'bg-dubois-emerald/20 border-dubois-emerald text-dubois-emerald'
                  : 'bg-dubois-cream border-dubois-ink text-dubois-charcoal'
              }
              ${isPlaying ? 'cursor-not-allowed' : 'hover:bg-dubois-tan'}
            `}
          >
            {s < stage ? '✓' : s + 1}
          </button>
        ))}
      </div>

      {/* Main visualization area */}
      <div className="relative bg-dubois-parchment border-2 border-dubois-ink p-6 min-h-[200px] md:min-h-[250px] overflow-hidden">
        {/* Human side */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <HumanIcon isActive={position === 'human' && !isMoving} />
          <span className="text-[10px] font-mono text-dubois-charcoal">You</span>
        </div>

        {/* Claude side */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <ClaudeIcon isActive={position === 'claude' && !isMoving} />
          <span className="text-[10px] font-mono text-dubois-charcoal">Claude</span>
        </div>

        {/* The evolving shape */}
        <div className="absolute left-20 md:left-24 top-1/2 -translate-y-1/2">
          <motion.div
            animate={{
              x: position === 'human' ? 0 : position === 'center' ? 'calc(50vw - 12rem)' : 'calc(100vw - 20rem)',
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="relative"
            style={{ maxWidth: 'calc(100vw - 16rem)' }}
          >
            <motion.div
              animate={{
                x: position === 'human' ? 0 : position === 'claude' ? 'min(200px, calc(100vw - 20rem))' : 'min(100px, calc(50vw - 10rem))',
              }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            >
              <EvolvingShape stage={stage} isMoving={isMoving} />
            </motion.div>
          </motion.div>
        </div>

        {/* Arrow indicators */}
        <div className="absolute inset-x-0 top-4 flex justify-center">
          <AnimatePresence mode="wait">
            {position === 'human' && !isMoving && (
              <motion.div
                key="human-label"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-dubois-gold/20 border border-dubois-gold px-3 py-1"
              >
                <span className="text-xs font-mono text-dubois-ink italic">
                  {STAGE_INFO[stage].human}
                </span>
              </motion.div>
            )}
            {position === 'claude' && !isMoving && (
              <motion.div
                key="claude-label"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-dubois-prussian/20 border border-dubois-prussian px-3 py-1"
              >
                <span className="text-xs font-mono text-dubois-prussian">
                  {STAGE_INFO[stage].claude}
                </span>
              </motion.div>
            )}
            {isMoving && (
              <motion.div
                key="moving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-dubois-charcoal"
                >
                  {position === 'claude' ? '→' : '←'}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Iteration label */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-dubois-cream border-2 border-dubois-ink">
          <span className="text-xs font-mono text-dubois-charcoal">
            {stage === 0 ? 'Initial idea' :
             stage === 5 ? 'Final result' :
             `Iteration ${stage}`}
          </span>
          {stage === 5 && !isPlaying && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-dubois-emerald text-xs font-mono font-bold"
            >
              ✓ Ready
            </motion.span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`
            px-4 py-2 font-mono text-sm transition-all flex items-center gap-2 border-2 border-dubois-ink
            ${isPlaying
              ? 'bg-dubois-charcoal text-dubois-cream cursor-not-allowed'
              : 'bg-dubois-carmine hover:bg-dubois-burgundy text-dubois-warm-white'
            }
          `}
        >
          {isPlaying ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-dubois-cream/30 border-t-dubois-cream rounded-full"
              />
              <span className="dubois-heading text-xs">Building...</span>
            </>
          ) : (
            <>
              <span className="dubois-heading text-xs">{stage === 5 ? 'Replay' : 'Watch the Loop'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Explanation */}
      <div className="mt-4 text-center">
        <p className="text-xs font-mono text-dubois-charcoal max-w-md mx-auto">
          {stage === 0
            ? 'Every visualization starts as a shapeless idea. Click play to watch it evolve.'
            : stage === 5
              ? 'Six exchanges. From blob to polished, interactive visualization.'
              : 'Human feedback shapes each iteration. Claude handles the implementation.'}
        </p>
      </div>
    </div>
  );
};

export default BuildLoop;
