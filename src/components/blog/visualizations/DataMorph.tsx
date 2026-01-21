import React, { useState } from 'react';
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

// Sample dataset - each point has x, y coordinates and a value for bar height
const DATA = [
  { x: 15, y: 25, value: 75, label: 'A' },
  { x: 30, y: 60, value: 40, label: 'B' },
  { x: 45, y: 35, value: 65, label: 'C' },
  { x: 60, y: 70, value: 30, label: 'D' },
  { x: 75, y: 45, value: 55, label: 'E' },
  { x: 90, y: 20, value: 80, label: 'F' },
];

const POINT_COLORS = [
  COLORS.carmine,
  COLORS.gold,
  COLORS.prussian,
  COLORS.emerald,
  COLORS.sepia,
  COLORS.burgundy,
];

type ViewMode = 'bars' | 'scatter' | 'line' | 'radial';

const VIEW_LABELS: Record<ViewMode, string> = {
  bars: 'Bar Chart',
  scatter: 'Scatter Plot',
  line: 'Connected Line',
  radial: 'Radial View',
};

const VIEW_DESCRIPTIONS: Record<ViewMode, string> = {
  bars: 'Traditional bar chart showing values as heights',
  scatter: 'Points positioned by two variables (x, y)',
  line: 'Same scatter data, now connected to show flow',
  radial: 'Data arranged around a center point',
};

// Chart constants
const CHART = {
  width: 120,
  height: 80,
  left: 15,
  right: 110,
  top: 10,
  bottom: 70,
  centerX: 62.5,
  centerY: 40,
};

export const DataMorph: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('bars');
  const views: ViewMode[] = ['bars', 'scatter', 'line', 'radial'];

  // Calculate positions for each view mode
  const getPosition = (d: typeof DATA[0], index: number): { x: number; y: number; width: number; height: number } => {
    const barWidth = 10;
    const barGap = (CHART.right - CHART.left - DATA.length * barWidth) / (DATA.length + 1);

    switch (viewMode) {
      case 'bars': {
        const x = CHART.left + barGap + index * (barWidth + barGap);
        const height = (d.value / 100) * (CHART.bottom - CHART.top - 5);
        const y = CHART.bottom - height;
        return { x, y, width: barWidth, height };
      }
      case 'scatter': {
        // Map x and y to chart coordinates
        const x = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
        const y = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
        return { x: x - 4, y: y - 4, width: 8, height: 8 };
      }
      case 'line': {
        // Same as scatter but will be connected
        const x = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
        const y = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
        return { x: x - 3, y: y - 3, width: 6, height: 6 };
      }
      case 'radial': {
        // Arrange in a circle
        const angle = (index / DATA.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 20 + (d.value / 100) * 15;
        const x = CHART.centerX + Math.cos(angle) * radius;
        const y = CHART.centerY + Math.sin(angle) * radius;
        return { x: x - 5, y: y - 5, width: 10, height: 10 };
      }
    }
  };

  // Generate line path for 'line' view
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

  // Generate radial spokes
  const getRadialSpokes = (): JSX.Element[] => {
    if (viewMode !== 'radial') return [];

    return DATA.map((d, i) => {
      const angle = (i / DATA.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 20 + (d.value / 100) * 15;
      const x = CHART.centerX + Math.cos(angle) * radius;
      const y = CHART.centerY + Math.sin(angle) * radius;

      return (
        <motion.line
          key={`spoke-${i}`}
          x1={CHART.centerX}
          y1={CHART.centerY}
          x2={x}
          y2={y}
          stroke={COLORS.charcoal}
          strokeWidth="0.5"
          strokeDasharray="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        />
      );
    });
  };

  const cycleView = () => {
    const currentIndex = views.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % views.length;
    setViewMode(views[nextIndex]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-4">
      {/* Title */}
      <div className="text-center mb-4">
        <h4 className="dubois-heading text-sm text-dubois-charcoal">
          Same Data, Different Views
        </h4>
        <p className="text-xs text-dubois-charcoal mt-1 font-mono">
          One dataset, four representations—with smooth transitions between them
        </p>
      </div>

      {/* View selector */}
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
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>

      {/* Main visualization */}
      <div className="bg-dubois-parchment border-2 border-dubois-ink p-4">
        <svg viewBox="0 0 125 85" className="w-full h-auto">
          {/* Axes - only show for bar/scatter/line */}
          {viewMode !== 'radial' && (
            <>
              {/* Y-axis */}
              <motion.line
                x1={CHART.left}
                y1={CHART.top}
                x2={CHART.left}
                y2={CHART.bottom}
                stroke={COLORS.ink}
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
              {/* X-axis */}
              <motion.line
                x1={CHART.left}
                y1={CHART.bottom}
                x2={CHART.right}
                y2={CHART.bottom}
                stroke={COLORS.ink}
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            </>
          )}

          {/* Radial center */}
          {viewMode === 'radial' && (
            <motion.circle
              cx={CHART.centerX}
              cy={CHART.centerY}
              r="3"
              fill={COLORS.charcoal}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Radial spokes */}
          <AnimatePresence>
            {viewMode === 'radial' && getRadialSpokes()}
          </AnimatePresence>

          {/* Connecting line for line view */}
          <AnimatePresence>
            {viewMode === 'line' && (
              <motion.path
                d={getLinePath()}
                fill="none"
                stroke={COLORS.charcoal}
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                exit={{ pathLength: 0 }}
                transition={{ duration: 0.6 }}
              />
            )}
          </AnimatePresence>

          {/* Data points */}
          {DATA.map((d, i) => {
            const pos = getPosition(d, i);
            const isCircle = viewMode === 'scatter' || viewMode === 'line' || viewMode === 'radial';

            return (
              <motion.g key={d.label}>
                {isCircle ? (
                  <motion.circle
                    cx={pos.x + pos.width / 2}
                    cy={pos.y + pos.height / 2}
                    r={pos.width / 2}
                    fill={POINT_COLORS[i]}
                    initial={false}
                    animate={{
                      cx: pos.x + pos.width / 2,
                      cy: pos.y + pos.height / 2,
                      r: pos.width / 2,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                ) : (
                  <motion.rect
                    x={pos.x}
                    y={pos.y}
                    width={pos.width}
                    height={pos.height}
                    fill={POINT_COLORS[i]}
                    rx={viewMode === 'bars' ? 1 : pos.width / 2}
                    initial={false}
                    animate={{
                      x: pos.x,
                      y: pos.y,
                      width: pos.width,
                      height: pos.height,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  />
                )}

                {/* Labels */}
                <motion.text
                  fontSize="4"
                  fill={COLORS.ink}
                  textAnchor="middle"
                  initial={false}
                  animate={{
                    x: viewMode === 'bars'
                      ? pos.x + pos.width / 2
                      : viewMode === 'radial'
                        ? pos.x + pos.width / 2
                        : pos.x + pos.width / 2,
                    y: viewMode === 'bars'
                      ? CHART.bottom + 6
                      : viewMode === 'radial'
                        ? pos.y + pos.height + 6
                        : pos.y - 3,
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                >
                  {d.label}
                </motion.text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Description */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-dubois-cream border-2 border-dubois-ink">
          <span className="text-xs font-mono text-dubois-charcoal">
            {VIEW_DESCRIPTIONS[viewMode]}
          </span>
        </div>
      </div>

      {/* Cycle button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={cycleView}
          className="px-4 py-2 font-mono text-xs bg-dubois-carmine hover:bg-dubois-burgundy text-dubois-warm-white border-2 border-dubois-ink transition-all flex items-center gap-2"
        >
          <span className="dubois-heading">Cycle View</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Explanation */}
      <div className="mt-4 text-center">
        <p className="text-xs font-mono text-dubois-charcoal max-w-md mx-auto">
          With raw SVG, the same data can flow between representations. Try this with a charting library.
        </p>
      </div>
    </div>
  );
};

export default DataMorph;
