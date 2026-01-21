import React, { useState } from 'react';
import { motion } from 'framer-motion';

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

type ViewMode = 'bars' | 'scatter' | 'line' | 'radial';

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
  const views: ViewMode[] = ['bars', 'scatter', 'line', 'radial'];

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
        const x = getBarX(index) + barWidth / 2;
        const height = getBarHeight(d.value);
        const y = CHART.bottom - height / 2;
        return { cx: x, cy: y, rx: barWidth / 2, ry: height / 2 };
      }
      case 'scatter': {
        const x = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
        const y = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
        return { cx: x, cy: y, rx: 5, ry: 5 };
      }
      case 'line': {
        const x = CHART.left + (d.x / 100) * (CHART.right - CHART.left);
        const y = CHART.bottom - (d.y / 100) * (CHART.bottom - CHART.top);
        return { cx: x, cy: y, rx: 4, ry: 4 };
      }
      case 'radial': {
        const angle = (index / DATA.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 12 + (d.value / maxValue) * 18;
        const x = CHART.centerX + Math.cos(angle) * radius;
        const y = CHART.centerY + Math.sin(angle) * radius;
        return { cx: x, cy: y, rx: 5, ry: 5 };
      }
    }
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
    const pos = getPosition(d, index);
    switch (viewMode) {
      case 'bars':
        return { x: pos.cx, y: CHART.bottom + 8 };
      case 'scatter':
      case 'line':
        return { x: pos.cx, y: pos.cy - 8 };
      case 'radial': {
        const angle = (index / DATA.length) * 2 * Math.PI - Math.PI / 2;
        const labelRadius = 12 + (d.value / maxValue) * 18 + 8;
        return {
          x: CHART.centerX + Math.cos(angle) * labelRadius,
          y: CHART.centerY + Math.sin(angle) * labelRadius + 2,
        };
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-4">
      <div className="text-center mb-4">
        <h4 className="dubois-heading text-sm text-dubois-charcoal">
          Same Data, Different Views
        </h4>
        <p className="text-xs text-dubois-charcoal mt-1 font-mono">
          One dataset, four representations
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
            {view === 'bars' ? 'Bar Chart' : view === 'scatter' ? 'Scatter Plot' : view === 'line' ? 'Connected' : 'Radial'}
          </button>
        ))}
      </div>

      <div className="bg-dubois-parchment border-2 border-dubois-ink p-4">
        <svg viewBox="0 0 125 85" className="w-full h-auto">
          {viewMode !== 'radial' && (
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

          {DATA.map((d, i) => {
            const pos = getPosition(d, i);
            return (
              <motion.ellipse
                key={d.label}
                fill={POINT_COLORS[i]}
                initial={false}
                animate={{
                  cx: pos.cx,
                  cy: pos.cy,
                  rx: pos.rx,
                  ry: pos.ry,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              />
            );
          })}

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
          Same six data points, morphing between views. Try this with a charting library.
        </p>
      </div>
    </div>
  );
};

export default DataMorph;
