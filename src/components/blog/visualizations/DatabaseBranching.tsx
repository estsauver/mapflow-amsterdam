import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple database block representation
const DataBlock: React.FC<{
  filled?: boolean;
  color: 'amber' | 'emerald';
  size?: 'sm' | 'md';
}> = ({ filled = true, color, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const colorClasses = color === 'amber'
    ? (filled ? 'bg-amber-500/60 border-amber-500' : 'bg-amber-500/10 border-amber-500/30')
    : (filled ? 'bg-emerald-500/60 border-emerald-500' : 'bg-emerald-500/10 border-emerald-500/30');

  return (
    <div className={`${sizeClasses} rounded border ${colorClasses}`} />
  );
};

// Database made of blocks
const BlockDatabase: React.FC<{
  label: string;
  color: 'amber' | 'emerald';
  blocks?: number;
  filledBlocks?: number;
  showPointer?: boolean;
  pointerLabel?: string;
}> = ({ label, color, blocks = 9, filledBlocks = 9, showPointer, pointerLabel }) => {
  const textColor = color === 'amber' ? 'text-amber-400' : 'text-emerald-400';
  const borderColor = color === 'amber' ? 'border-amber-500/30' : 'border-emerald-500/30';

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`text-[10px] font-mono ${textColor}`}>{label}</span>
      <div className={`relative p-2 rounded-lg border ${borderColor} bg-slate-900/50`}>
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
            className={`absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`w-px h-4 ${color === 'amber' ? 'bg-amber-500/50' : 'bg-emerald-500/50'}`} />
            <span className={`text-[8px] font-mono ${textColor} whitespace-nowrap`}>{pointerLabel}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Arrow showing data flow
const CopyArrow: React.FC<{
  color: 'amber' | 'emerald';
  label: string;
  animated?: boolean;
}> = ({ color, label, animated }) => {
  const colorClass = color === 'amber' ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.svg
        className={`w-5 h-5 ${colorClass}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        animate={animated ? { y: [0, 3, 0] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </motion.svg>
      <span className={`text-[8px] font-mono ${colorClass}`}>{label}</span>
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
        <h3 className="font-mono text-sm text-slate-400 mb-2">Database Cloning: Full Copy vs Copy-on-Write</h3>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-8">

        {/* Full Copy (Template Cloning) */}
        <motion.div
          className="relative rounded-xl border-2 p-6 border-amber-500/30 bg-amber-500/5"
          initial={hasAppeared.current ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="absolute -top-3 left-4 px-2 bg-slate-950">
            <span className="font-mono text-xs text-amber-400">Full Copy</span>
          </div>

          {/* Source */}
          <div className="flex flex-col items-center mb-4">
            <BlockDatabase label="source" color="amber" />
          </div>

          <CopyArrow color="amber" label="copy all data" animated={isPlaying && step > 0 && step < 15} />

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
                    <div className="p-1 rounded border border-amber-500/30 bg-slate-900/50">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(9)].map((_, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-sm bg-amber-500/60 border border-amber-500" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
          </div>

          {/* Stats */}
          <div className="mt-6 pt-4 border-t border-amber-500/20 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">Storage</span>
              <span className="text-amber-400">{step > 0 ? `${(step + 1) * 15} GB` : '15 GB'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">Time</span>
              <span className="text-amber-400">{step > 0 ? `~${step * 30}s` : '~30s each'}</span>
            </div>
          </div>
        </motion.div>

        {/* Copy-on-Write */}
        <motion.div
          className="relative rounded-xl border-2 p-6 border-emerald-500/30 bg-emerald-500/5"
          initial={hasAppeared.current ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="absolute -top-3 left-4 px-2 bg-slate-950">
            <span className="font-mono text-xs text-emerald-400">Copy-on-Write</span>
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
                    <div className="p-1 rounded border border-emerald-500/30 bg-slate-900/50">
                      <div className="grid grid-cols-3 gap-0.5">
                        {/* Show mostly empty with just 1 filled block for delta */}
                        {[...Array(9)].map((_, j) => (
                          <div
                            key={j}
                            className={`w-1.5 h-1.5 rounded-sm border ${
                              j === 0
                                ? 'bg-emerald-500/60 border-emerald-500'
                                : 'bg-emerald-500/5 border-emerald-500/20 border-dashed'
                            }`}
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
          <div className="mt-6 pt-4 border-t border-emerald-500/20 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">Storage</span>
              <span className="text-emerald-400">{step > 0 ? `15 GB + ${step * 10} MB` : '15 GB'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">Time</span>
              <span className="text-emerald-400">instant</span>
            </div>
          </div>

          {/* Sparkle when done */}
          {step >= 15 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-3 right-3"
            >
              <span className="text-emerald-400">✓</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className={`
            px-4 py-2 rounded-lg font-mono text-sm transition-all
            ${isPlaying
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border border-slate-600'
            }
          `}
        >
          {step >= 15 ? 'Replay' : 'Create 15 Clones'}
        </button>
      </div>

      {/* Explanation */}
      <div className="mt-6 text-center">
        <p className="text-xs font-mono text-slate-500">
          Full copy duplicates all data. Copy-on-Write shares unchanged blocks, only storing differences.
        </p>
      </div>
    </div>
  );
};

export default DatabaseBranching;
