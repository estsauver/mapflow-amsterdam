import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

// Icons
const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

const SpeakerIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const FilmIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
  </svg>
);

interface Stage {
  id: number;
  name: string;
  icon: React.ReactNode;
  phase: 'scripting' | 'recording' | 'production';
  isHumanCheckpoint?: boolean;
  costAnnotation?: string;
}

const stages: Stage[] = [
  { id: 1, name: 'Outline', icon: <DocumentIcon />, phase: 'scripting' },
  { id: 2, name: 'Script', icon: <CodeIcon />, phase: 'scripting' },
  { id: 3, name: 'Validate', icon: <CheckIcon />, phase: 'scripting' },
  { id: 4, name: 'Record', icon: <VideoIcon />, phase: 'recording' },
  { id: 5, name: 'Narration', icon: <PencilIcon />, phase: 'recording' },
  { id: 6, name: 'Review', icon: <PauseIcon />, phase: 'recording', isHumanCheckpoint: true },
  { id: 7, name: 'Audio', icon: <SpeakerIcon />, phase: 'production', costAnnotation: '$0.15' },
  { id: 8, name: 'Composite', icon: <FilmIcon />, phase: 'production' },
  { id: 9, name: 'Upload', icon: <UploadIcon />, phase: 'production' },
];

const phaseColors = {
  scripting: COLORS.prussian,
  recording: COLORS.emerald,
  production: COLORS.carmine,
};

const phaseLabels = {
  scripting: 'Scripting',
  recording: 'Recording',
  production: 'Production',
};

interface StageBoxProps {
  stage: Stage;
  isHovered: boolean;
  onHover: (hovering: boolean) => void;
  delay: number;
  hasAppeared: boolean;
}

const StageBox: React.FC<StageBoxProps> = ({ stage, isHovered, onHover, delay, hasAppeared }) => {
  const phaseColor = phaseColors[stage.phase];

  return (
    <motion.div
      className="relative"
      initial={hasAppeared ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: hasAppeared ? 0 : delay }}
    >
      <motion.div
        className={`
          relative flex flex-col items-center justify-center
          w-16 h-16 sm:w-20 sm:h-20 border-2 cursor-pointer
          transition-all duration-200
          ${isHovered ? 'scale-110 shadow-lg' : ''}
        `}
        style={{
          backgroundColor: isHovered ? `${phaseColor}20` : COLORS.cream,
          borderColor: phaseColor,
        }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        {/* Stage number */}
        <div
          className="absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold"
          style={{
            backgroundColor: phaseColor,
            color: COLORS.cream,
          }}
        >
          {stage.id}
        </div>

        {/* Human checkpoint indicator */}
        {stage.isHumanCheckpoint && (
          <div
            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.ink,
            }}
            title="Human checkpoint"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}

        {/* Cost annotation */}
        {stage.costAnnotation && (
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[9px] font-mono font-bold whitespace-nowrap"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.ink,
            }}
          >
            {stage.costAnnotation}
          </div>
        )}

        {/* Icon */}
        <div style={{ color: phaseColor }}>
          {stage.icon}
        </div>

        {/* Name */}
        <span
          className="mt-1 text-[9px] sm:text-[10px] font-mono text-center leading-tight"
          style={{ color: COLORS.charcoal }}
        >
          {stage.name}
        </span>
      </motion.div>
    </motion.div>
  );
};

const Arrow: React.FC<{ delay: number; hasAppeared: boolean }> = ({ delay, hasAppeared }) => (
  <motion.div
    className="flex items-center justify-center w-4 sm:w-6"
    initial={hasAppeared ? false : { opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: hasAppeared ? 0 : delay }}
  >
    <svg
      className="w-3 h-3 sm:w-4 sm:h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke={COLORS.charcoal}
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  </motion.div>
);

// Module-level variable to persist animation state across remounts
let hasAnimatedOnce = false;

export const PipelineOverview: React.FC = () => {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [hasAppeared, setHasAppeared] = useState(hasAnimatedOnce);

  useEffect(() => {
    if (hasAnimatedOnce) return;
    const timeout = setTimeout(() => {
      hasAnimatedOnce = true;
      setHasAppeared(true);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  // Group stages by phase for rendering
  const phases = ['scripting', 'recording', 'production'] as const;

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-4 sm:p-6">
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
        {phases.map((phase) => (
          <div key={phase} className="flex items-center gap-2">
            <div className="w-3 h-3" style={{ backgroundColor: phaseColors[phase] }} />
            <span className="text-xs font-mono text-dubois-charcoal">{phaseLabels[phase]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.gold }}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={COLORS.ink} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <span className="text-xs font-mono text-dubois-charcoal">Human checkpoint</span>
        </div>
      </div>

      {/* Pipeline diagram - Desktop (two rows) */}
      <div className="hidden sm:block">
        {/* Row 1: Stages 1-5 */}
        <div className="flex items-center justify-center gap-1 mb-4">
          {stages.slice(0, 5).map((stage, index) => (
            <React.Fragment key={stage.id}>
              <StageBox
                stage={stage}
                isHovered={hoveredStage === stage.id}
                onHover={(hovering) => setHoveredStage(hovering ? stage.id : null)}
                delay={index * 0.1}
                hasAppeared={hasAppeared}
              />
              {index < 4 && (
                <Arrow delay={(index + 1) * 0.1} hasAppeared={hasAppeared} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Connector between rows */}
        <div className="flex justify-end pr-[10%] mb-4">
          <motion.svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke={COLORS.charcoal}
            strokeWidth={2}
            initial={hasAppeared ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: hasAppeared ? 0 : 0.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </motion.svg>
        </div>

        {/* Row 2: Stages 6-9 */}
        <div className="flex items-center justify-center gap-1">
          {stages.slice(5).map((stage, index) => (
            <React.Fragment key={stage.id}>
              <StageBox
                stage={stage}
                isHovered={hoveredStage === stage.id}
                onHover={(hovering) => setHoveredStage(hovering ? stage.id : null)}
                delay={0.5 + index * 0.1}
                hasAppeared={hasAppeared}
              />
              {index < 3 && (
                <Arrow delay={0.5 + (index + 1) * 0.1} hasAppeared={hasAppeared} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pipeline diagram - Mobile (3x3 grid) */}
      <div className="sm:hidden">
        {phases.map((phase, phaseIndex) => {
          const phaseStages = stages.filter((s) => s.phase === phase);
          return (
            <div key={phase} className="mb-4">
              {/* Phase label */}
              <div
                className="text-[10px] font-mono mb-2 px-2 py-0.5 inline-block"
                style={{
                  backgroundColor: `${phaseColors[phase]}20`,
                  color: phaseColors[phase],
                  borderLeft: `2px solid ${phaseColors[phase]}`,
                }}
              >
                {phaseLabels[phase]}
              </div>

              {/* Stages in this phase */}
              <div className="flex items-center justify-center gap-2">
                {phaseStages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <StageBox
                      stage={stage}
                      isHovered={hoveredStage === stage.id}
                      onHover={(hovering) => setHoveredStage(hovering ? stage.id : null)}
                      delay={phaseIndex * 0.3 + index * 0.1}
                      hasAppeared={hasAppeared}
                    />
                    {index < phaseStages.length - 1 && (
                      <Arrow delay={phaseIndex * 0.3 + (index + 1) * 0.1} hasAppeared={hasAppeared} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Arrow to next phase */}
              {phaseIndex < phases.length - 1 && (
                <div className="flex justify-center my-2">
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={COLORS.charcoal}
                    strokeWidth={2}
                    initial={hasAppeared ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: hasAppeared ? 0 : (phaseIndex + 1) * 0.3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                  </motion.svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover description */}
      <motion.div
        className="mt-6 h-12 flex items-center justify-center"
        initial={hasAppeared ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: hasAppeared ? 0 : 1 }}
      >
        {hoveredStage && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span
              className="text-xs font-mono px-3 py-1 border"
              style={{
                borderColor: phaseColors[stages[hoveredStage - 1].phase],
                backgroundColor: `${phaseColors[stages[hoveredStage - 1].phase]}10`,
                color: COLORS.charcoal,
              }}
            >
              Stage {hoveredStage}: {getStageDescription(hoveredStage)}
            </span>
          </motion.div>
        )}
        {!hoveredStage && (
          <span className="text-xs font-mono text-dubois-charcoal opacity-60">
            Hover over a stage to see details
          </span>
        )}
      </motion.div>
    </div>
  );
};

function getStageDescription(stageId: number): string {
  const descriptions: Record<number, string> = {
    1: 'Analyze git diff, interview user, produce scene breakdown',
    2: 'Write Playwright automation script from outline',
    3: 'Dry-run script, catch selector issues early',
    4: 'Execute in K8s job, capture video',
    5: 'Write voiceover text with timestamps',
    6: 'Human reviews narration before TTS',
    7: 'Call ElevenLabs, generate speech',
    8: 'Merge video and audio with ffmpeg',
    9: 'Push to GCS, generate shareable URL',
  };
  return descriptions[stageId] || '';
}

export default PipelineOverview;
