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

// Simple database block representation
const DataBlock: React.FC<{
  filled?: boolean;
  color: 'carmine' | 'emerald';
  size?: 'sm' | 'md';
}> = ({ filled = true, color, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const baseColor = color === 'carmine' ? COLORS.carmine : COLORS.emerald;

  return (
    <div
      className={sizeClasses}
      style={{
        backgroundColor: filled ? baseColor : COLORS.parchment,
        border: `1px solid ${filled ? baseColor : COLORS.charcoal}40`,
      }}
    />
  );
};

// Database made of blocks
const BlockDatabase: React.FC<{
  label: string;
  color: 'carmine' | 'emerald';
  blocks?: number;
  filledBlocks?: number;
  showPointer?: boolean;
  pointerLabel?: string;
}> = ({ label, color, blocks = 9, filledBlocks = 9, showPointer, pointerLabel }) => {
  const baseColor = color === 'carmine' ? COLORS.carmine : COLORS.emerald;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-mono" style={{ color: baseColor }}>{label}</span>
      <div
        className="relative p-2"
        style={{
          border: `2px solid ${baseColor}`,
          backgroundColor: COLORS.cream,
        }}
      >
        <div className="grid grid-cols-3 gap-1">
          {[...Array(blocks)].map((_, i) => (
            <DataBlock
              key={i}
              color={color}
              filled={i < filledBlocks}
              size="sm"
            />
          ))}
        </div>
        {showPointer && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-px h-4" style={{ backgroundColor: `${baseColor}50` }} />
            <span className="text-[8px] font-mono whitespace-nowrap" style={{ color: baseColor }}>{pointerLabel}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Arrow showing data flow
const CopyArrow: React.FC<{
  color: 'carmine' | 'emerald';
  label: string;
  animated?: boolean;
}> = ({ color, label, animated }) => {
  const baseColor = color === 'carmine' ? COLORS.carmine : COLORS.emerald;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.svg
        className="w-5 h-5"
        style={{ color: baseColor }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        animate={animated ? { y: [0, 3, 0] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </motion.svg>
      <span className="text-[8px] font-mono" style={{ color: baseColor }}>{label}</span>
    </div>
  );
};

export const DatabaseBranching: React.FC = () => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasAppeared = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      hasAppeared.current = true;
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const handlePlay = () => {
    setStep(0);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying) return;

    if (step < 15) {
      const timeout = setTimeout(() => {
        setStep(prev => prev + 1);
      }, 200);
      return () => clearTimeout(timeout);
    }

    setIsPlaying(false);
  }, [isPlaying, step]);

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="font-mono text-sm text-dubois-charcoal mb-2">Database Cloning: Full Copy vs Copy-on-Write</h3>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-8">

        {/* Full Copy (Template Cloning) */}
        <motion.div
          className="relative border-2 p-6"
          style={{
            borderColor: `${COLORS.carmine}50`,
            backgroundColor: `${COLORS.carmine}08`,
          }}
          initial={hasAppeared.current ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div
            className="absolute -top-3 left-4 px-2"
            style={{ backgroundColor: COLORS.parchment }}
          >
            <span className="font-mono text-xs" style={{ color: COLORS.carmine }}>Full Copy</span>
          </div>

          {/* Source */}
          <div className="flex flex-col items-center mb-4">
            <BlockDatabase label="source" color="carmine" />
          </div>

          <CopyArrow color="carmine" label="copy all data" animated={isPlaying && step > 0 && step < 15} />

          {/* Clones */}
          <div className="flex flex-wrap justify-center gap-1 mt-4 min-h-[100px]">
            <AnimatePresence>
              {[...Array(15)].map((_, i) => (
                step > i && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className="p-1"
                      style={{
                        border: `1px solid ${COLORS.carmine}`,
                        backgroundColor: COLORS.cream,
                      }}
                    >
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(9)].map((_, j) => (
                          <div
                            key={j}
                            className="w-1.5 h-1.5"
                            style={{
                              backgroundColor: COLORS.carmine,
                              border: `1px solid ${COLORS.burgundy}`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div
            className="mt-6 pt-4 space-y-2"
            style={{ borderTop: `1px solid ${COLORS.carmine}20` }}
          >
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: COLORS.charcoal }}>Storage</span>
              <span style={{ color: COLORS.carmine }}>{step > 0 ? `${(step + 1) * 15} GB` : '15 GB'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: COLORS.charcoal }}>Time</span>
              <span style={{ color: COLORS.carmine }}>{step > 0 ? `~${step * 30}s` : '~30s each'}</span>
            </div>
          </div>
        </motion.div>

        {/* Copy-on-Write */}
        <motion.div
          className="relative border-2 p-6"
          style={{
            borderColor: `${COLORS.emerald}50`,
            backgroundColor: `${COLORS.emerald}08`,
          }}
          initial={hasAppeared.current ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div
            className="absolute -top-3 left-4 px-2"
            style={{ backgroundColor: COLORS.parchment }}
          >
            <span className="font-mono text-xs" style={{ color: COLORS.emerald }}>Copy-on-Write</span>
          </div>

          {/* Source */}
          <div className="flex flex-col items-center mb-4">
            <BlockDatabase label="source" color="emerald" />
          </div>

          <CopyArrow color="emerald" label="share + track changes" animated={isPlaying && step > 0 && step < 15} />

          {/* Clones - shown as references */}
          <div className="flex flex-wrap justify-center gap-1 mt-4 min-h-[100px]">
            <AnimatePresence>
              {[...Array(15)].map((_, i) => (
                step > i && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.08, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className="p-1"
                      style={{
                        border: `1px solid ${COLORS.emerald}`,
                        backgroundColor: COLORS.cream,
                      }}
                    >
                      <div className="grid grid-cols-3 gap-0.5">
                        {/* Show mostly empty with just 1 filled block for delta */}
                        {[...Array(9)].map((_, j) => (
                          <div
                            key={j}
                            className="w-1.5 h-1.5"
                            style={{
                              backgroundColor: j === 0 ? `${COLORS.emerald}` : COLORS.parchment,
                              border: j === 0
                                ? `1px solid ${COLORS.emerald}`
                                : `1px dashed ${COLORS.charcoal}40`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div
            className="mt-6 pt-4 space-y-2"
            style={{ borderTop: `1px solid ${COLORS.emerald}20` }}
          >
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: COLORS.charcoal }}>Storage</span>
              <span style={{ color: COLORS.emerald }}>{step > 0 ? `15 GB + ${step * 10} MB` : '15 GB'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span style={{ color: COLORS.charcoal }}>Time</span>
              <span style={{ color: COLORS.emerald }}>instant</span>
            </div>
          </div>

          {/* Sparkle when done */}
          {step >= 15 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-3 right-3"
            >
              <span style={{ color: COLORS.emerald }}>✓</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="px-4 py-2 font-mono text-sm transition-all border-2"
          style={{
            backgroundColor: isPlaying ? COLORS.cream : COLORS.prussian,
            color: isPlaying ? COLORS.charcoal : COLORS.cream,
            borderColor: COLORS.ink,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            opacity: isPlaying ? 0.6 : 1,
          }}
        >
          {step >= 15 ? 'Replay' : 'Create 15 Clones'}
        </button>
      </div>

      {/* Explanation */}
      <div className="mt-6 text-center">
        <p className="text-xs font-mono" style={{ color: COLORS.charcoal }}>
          Full copy duplicates all data. Copy-on-Write shares unchanged blocks, only storing differences.
        </p>
      </div>
    </div>
  );
};

export default DatabaseBranching;
