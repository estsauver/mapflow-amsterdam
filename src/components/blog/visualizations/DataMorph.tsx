import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = {
  carmine: '#C41E3A',
  gold: '#DAA520',
  prussian: '#1E3A5F',
  emerald: '#2E8B57',
  ink: '#1A1A1A',
  charcoal: '#4A4A4A',
  sepia: '#8B4513',
  burgundy: '#800020',
};

const DATA = [
  { x: 15, y: 75, value: 75, label: 'A' },
  { x: 30, y: 40, value: 40, label: 'B' },
  { x: 50, y: 65, value: 65, label: 'C' },
  { x: 65, y: 30, value: 30, label: 'D' },
  { x: 80, y: 55, value: 55, label: 'E' },
  { x: 95, y: 80, value: 80, label: 'F' },
];

const POINT_COLORS = [
  COLORS.carmine,
  COLORS.gold,
  COLORS.prussian,
  COLORS.emerald,
  COLORS.sepia,
  COLORS.burgundy,
];

type ViewMode = 'bars' | 'scatter' | 'line' | 'radial' | 'pigeons';

const CHART = {
  left: 20,
  right: 105,
  top: 12,
  bottom: 68,
  centerX: 62,
  centerY: 40,
};

export const DataMorph: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('bars');
  const views: ViewMode[] = ['bars', 'scatter', 'line', 'radial', 'pigeons'];

  const maxValue = Math.max(...DATA.map(d => d.value));
  const barWidth = 10;
  const totalBarsWidth = DATA.length * barWidth;
  const totalGaps = (CHART.right - CHART.left - totalBarsWidth);
  const barGap = totalGaps / (DATA.length + 1);

  const getBarX = (index: number) => CHART.left + barGap + index * (barWidth + barGap);
  const getBarHeight = (value: number) => (value / maxValue) * (CHART.bottom - CHART.top - 5);

  const getPosition = (d: typeof DATA[0], index: number) => {
    switch (viewMode) {
      case 'bars': {
        const x = getBarX(index);
        const height = getBarHeight(d.value);
        const y = CHART.bottom - height;
        return { x, y, width: barWidth, height, rx: 1 };
      }
      case 'scatter': {
        const cx = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
        const cy = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
        const size = 10;
        return { x: cx - size/2, y: cy - size/2, width: size, height: size, rx: size/2 };
      }
      case 'line': {
        const cx = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
        const cy = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
        const size = 8;
        return { x: cx - size/2, y: cy - size/2, width: size, height: size, rx: size/2 };
      }
      case 'radial': {
        const angle = (index / DATA.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 12 + (d.value / maxValue) * 18;
        const cx = CHART.centerX + Math.cos(angle) * radius;
        const cy = CHART.centerY + Math.sin(angle) * radius;
        const size = 10;
        return { x: cx - size/2, y: cy - size/2, width: size, height: size, rx: size/2 };
      }
      case 'pigeons': {
        const flyX = 20 + index * 20 + (index % 2) * 10;
        const flyY = -20 - index * 8;
        return { x: flyX, y: flyY, width: 10, height: 10, rx: 5 };
      }
    }
  };

  const getPigeonPosition = (index: number) => {
    const flyX = 30 + index * 18 + (index % 2) * 5;
    const flyY = -15 - index * 6 - (index % 3) * 4;
    const rotation = -30 - index * 5 + (index % 2) * 10;
    return { x: flyX, y: flyY, rotation };
  };

  const getLinePath = (): string => {
    if (viewMode !== 'line') return '';
    const sortedData = [...DATA].sort((a, b) => a.x - b.x);
    const points = sortedData.map(d => {
      const x = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
      const y = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getLabelPosition = (d: typeof DATA[0], index: number) => {
    if (viewMode === 'pigeons') {
      return { x: -100, y: -100, opacity: 0 };
    }
    const pos = getPosition(d, index);
    switch (viewMode) {
      case 'bars':
        return { x: pos.x + pos.width / 2, y: CHART.bottom + 8, opacity: 1 };
      case 'scatter':
      case 'line':
        return { x: pos.x + pos.width / 2, y: pos.y - 4, opacity: 1 };
      case 'radial': {
        const angle = (index / DATA.length) * 2 * Math.PI - Math.PI / 2;
        const labelRadius = 12 + (d.value / maxValue) * 18 + 10;
        return {
          x: CHART.centerX + Math.cos(angle) * labelRadius,
          y: CHART.centerY + Math.sin(angle) * labelRadius + 2,
          opacity: 1,
        };
      }
      default:
        return { x: 0, y: 0, opacity: 0 };
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-4">
      <div className="text-center mb-4">
        <h4 className="dubois-heading text-sm text-dubois-charcoal">
          Same Data, Different Views
        </h4>
        <p className="text-xs text-dubois-charcoal mt-1 font-mono">
          One dataset, {viewMode === 'pigeons' ? 'gone' : 'four representations'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => setViewMode(view)}
            className={`
              px-3 py-1 font-mono text-xs border-2 transition-all
              ${view === viewMode
                ? 'bg-dubois-prussian border-dubois-prussian text-dubois-cream'
                : 'bg-dubois-cream border-dubois-ink text-dubois-charcoal hover:bg-dubois-tan'
              }
            `}
          >
            {view === 'bars' ? 'Bar Chart' : view === 'scatter' ? 'Scatter Plot' : view === 'line' ? 'Connected' : view === 'radial' ? 'Radial' : 'Pigeons'}
          </button>
        ))}
      </div>

      <div className="bg-dubois-parchment border-2 border-dubois-ink p-4 overflow-hidden">
        <svg viewBox="0 0 125 85" className="w-full h-auto">
          {viewMode !== 'radial' && viewMode !== 'pigeons' && (
            <>
              <line
                x1={CHART.left}
                y1={CHART.top}
                x2={CHART.left}
                y2={CHART.bottom}
                stroke={COLORS.ink}
                strokeWidth="1"
              />
              <line
                x1={CHART.left}
                y1={CHART.bottom}
                x2={CHART.right}
                y2={CHART.bottom}
                stroke={COLORS.ink}
                strokeWidth="1"
              />
            </>
          )}

          {viewMode === 'radial' && (
            <>
              <circle
                cx={CHART.centerX}
                cy={CHART.centerY}
                r="3"
                fill={COLORS.charcoal}
              />
              {DATA.map((d, i) => {
                const angle = (i / DATA.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 12 + (d.value / maxValue) * 18;
                return (
                  <line
                    key={`spoke-${i}`}
                    x1={CHART.centerX}
                    y1={CHART.centerY}
                    x2={CHART.centerX + Math.cos(angle) * radius}
                    y2={CHART.centerY + Math.sin(angle) * radius}
                    stroke={COLORS.charcoal}
                    strokeWidth="0.5"
                    strokeDasharray="2"
                  />
                );
              })}
            </>
          )}

          {viewMode === 'line' && (
            <motion.path
              d={getLinePath()}
              fill="none"
              stroke={COLORS.charcoal}
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          <AnimatePresence mode="wait">
            {viewMode === 'pigeons' ? (
              DATA.map((d, i) => {
                const pigeonPos = getPigeonPosition(i);
                return (
                  <motion.g
                    key={`pigeon-${d.label}`}
                    initial={{
                      x: getBarX(i) + barWidth/2,
                      y: CHART.bottom - getBarHeight(d.value)/2,
                      scale: 0.5,
                      rotate: 0,
                    }}
                    animate={{
                      x: pigeonPos.x,
                      y: pigeonPos.y,
                      scale: 1,
                      rotate: pigeonPos.rotation,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 50,
                      damping: 10,
                      delay: i * 0.1,
                    }}
                  >
                    <motion.ellipse
                      cx="0"
                      cy="0"
                      rx="5"
                      ry="3"
                      fill={POINT_COLORS[i]}
                    />
                    <motion.path
                      d="M-2,-2 Q0,-6 3,-3"
                      fill="none"
                      stroke={POINT_COLORS[i]}
                      strokeWidth="2"
                      strokeLinecap="round"
                      animate={{
                        d: ["M-2,-2 Q0,-6 3,-3", "M-2,-2 Q0,-1 3,-2", "M-2,-2 Q0,-6 3,-3"],
                      }}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <circle cx="4" cy="-1" r="2" fill={POINT_COLORS[i]} />
                    <path d="M6,-1 L8,-0.5 L6,0" fill={COLORS.gold} />
                  </motion.g>
                );
              })
            ) : (
              DATA.map((d, i) => {
                const pos = getPosition(d, i);
                return (
                  <motion.rect
                    key={d.label}
                    fill={POINT_COLORS[i]}
                    initial={false}
                    animate={{
                      x: pos.x,
                      y: pos.y,
                      width: pos.width,
                      height: pos.height,
                      rx: pos.rx,
                    }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  />
                );
              })
            )}
          </AnimatePresence>

          {DATA.map((d, i) => {
            const labelPos = getLabelPosition(d, i);
            return (
              <motion.text
                key={`label-${d.label}`}
                fontSize="5"
                fill={COLORS.ink}
                textAnchor="middle"
                initial={false}
                animate={{
                  x: labelPos.x,
                  y: labelPos.y,
                  opacity: labelPos.opacity,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                {d.label}
              </motion.text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs font-mono text-dubois-charcoal max-w-md mx-auto">
          {viewMode === 'pigeons'
            ? "And sometimes your data just flies away."
            : "Same six data points, morphing between views. Try this with a charting library."}
        </p>
      </div>
    </div>
  );
};

export default DataMorph;
