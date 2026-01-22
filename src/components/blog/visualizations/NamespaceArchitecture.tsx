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

interface Service {
  name: string;
  icon: React.ReactNode;
}

const DatabaseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const FunnelIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);

const ServerIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const CogIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
  </svg>
);

const NamespaceBox: React.FC<{
  title: string;
  type: 'infra' | 'worktree';
  services: Service[];
  isHovered: boolean;
  isOtherHovered: boolean;
  onHover: (hovering: boolean) => void;
  connectionActive: boolean;
  hasAppeared: boolean;
}> = ({ title, type, services, isHovered, isOtherHovered, onHover, connectionActive, hasAppeared }) => {
  const isInfra = type === 'infra';

  return (
    <motion.div
      className={`
        relative border-2 p-4 transition-all duration-300 cursor-pointer
        ${isInfra
          ? 'bg-dubois-gold/10 border-dubois-gold'
          : 'bg-dubois-prussian/10 border-dubois-prussian'
        }
        ${isHovered ? 'scale-105 shadow-xl' : ''}
        ${isOtherHovered ? 'opacity-50' : ''}
      `}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2"
            style={{ backgroundColor: isInfra ? COLORS.gold : COLORS.prussian }}
          />
          <span
            className="font-mono text-sm font-medium"
            style={{ color: isInfra ? COLORS.gold : COLORS.prussian }}
          >
            {title}
          </span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 border"
          style={{
            backgroundColor: isInfra ? `${COLORS.gold}20` : `${COLORS.prussian}20`,
            color: isInfra ? COLORS.gold : COLORS.prussian,
            borderColor: isInfra ? COLORS.gold : COLORS.prussian,
          }}
        >
          {isInfra ? 'shared' : 'isolated'}
        </span>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-2 gap-2">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={hasAppeared ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasAppeared ? 0 : index * 0.05 }}
            className="flex items-center gap-2 px-2 py-1.5 text-xs border"
            style={{
              backgroundColor: isInfra ? `${COLORS.gold}15` : `${COLORS.prussian}15`,
              color: isInfra ? COLORS.sepia : COLORS.prussian,
              borderColor: isInfra ? `${COLORS.gold}40` : `${COLORS.prussian}40`,
            }}
          >
            <span className="opacity-60">{service.icon}</span>
            <span className="truncate">{service.name}</span>
          </motion.div>
        ))}
      </div>

      {/* Connection indicator */}
      {connectionActive && !isInfra && (
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          initial={hasAppeared ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            className="w-2 h-6"
            style={{
              background: `linear-gradient(to top, ${COLORS.prussian}80, ${COLORS.gold}80)`,
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// Module-level variable to persist animation state across remounts
let hasAnimatedOnce = false;

export const NamespaceArchitecture: React.FC = () => {
  const [hoveredNamespace, setHoveredNamespace] = useState<string | null>(null);
  const [hasAppeared, setHasAppeared] = useState(hasAnimatedOnce);

  // Mark as appeared after initial mount
  useEffect(() => {
    if (hasAnimatedOnce) return;
    const timeout = setTimeout(() => {
      hasAnimatedOnce = true;
      setHasAppeared(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const infraServices: Service[] = [
    { name: 'postgresql', icon: <DatabaseIcon /> },
    { name: 'temporal-server', icon: <ClockIcon /> },
    { name: 'grafana', icon: <ChartIcon /> },
    { name: 'prometheus', icon: <ChartIcon /> },
    { name: 'jaeger', icon: <ChartIcon /> },
    { name: 'loki', icon: <ChartIcon /> },
    { name: 'otel-collector', icon: <FunnelIcon /> },
  ];

  const worktreeServices: Service[] = [
    { name: 'frontend', icon: <GlobeIcon /> },
    { name: 'backend', icon: <ServerIcon /> },
    { name: 'temporal-worker', icon: <CogIcon /> },
  ];

  const worktrees = [
    { name: 'worktree-main', services: worktreeServices },
    { name: 'worktree-earl-fib-123-feature', services: worktreeServices },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-6">
      {/* Legend */}
      <div className="flex justify-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: COLORS.gold }} />
          <span className="text-xs font-mono text-dubois-charcoal">Shared (runs once)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3" style={{ backgroundColor: COLORS.prussian }} />
          <span className="text-xs font-mono text-dubois-charcoal">Isolated (per worktree)</span>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="relative">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`${COLORS.gold}50`} />
              <stop offset="100%" stopColor={`${COLORS.prussian}50`} />
            </linearGradient>
          </defs>

          {/* Lines from infra to each worktree */}
          {worktrees.map((wt, index) => {
            const isActive = hoveredNamespace === 'infra' || hoveredNamespace === wt.name;
            const xOffset = index === 0 ? '30%' : '70%';

            return (
              <motion.line
                key={wt.name}
                x1="50%"
                y1="35%"
                x2={xOffset}
                y2="65%"
                stroke={isActive ? 'url(#connectionGradient)' : `${COLORS.charcoal}30`}
                strokeWidth={isActive ? 3 : 1}
                strokeDasharray={isActive ? '0' : '4 4'}
                initial={hasAppeared ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: hasAppeared ? 0 : 0.5, delay: hasAppeared ? 0 : index * 0.2 }}
              />
            );
          })}
        </svg>

        {/* Infra namespace */}
        <div className="relative z-10 mb-8 flex justify-center">
          <div className="w-full max-w-md">
            <NamespaceBox
              title="infra/"
              type="infra"
              services={infraServices}
              isHovered={hoveredNamespace === 'infra'}
              isOtherHovered={hoveredNamespace !== null && hoveredNamespace !== 'infra'}
              onHover={(hovering) => setHoveredNamespace(hovering ? 'infra' : null)}
              connectionActive={false}
              hasAppeared={hasAppeared}
            />
          </div>
        </div>

        {/* Data flow indicator */}
        <div className="flex justify-center my-4">
          <motion.div
            className="flex flex-col items-center gap-1 text-dubois-charcoal"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[10px] font-mono">telemetry flows up</span>
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>

        {/* Worktree namespaces */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {worktrees.map((wt) => (
            <NamespaceBox
              key={wt.name}
              title={wt.name.replace('worktree-', '') + '/'}
              type="worktree"
              services={wt.services}
              isHovered={hoveredNamespace === wt.name}
              isOtherHovered={hoveredNamespace !== null && hoveredNamespace !== wt.name && hoveredNamespace !== 'infra'}
              onHover={(hovering) => setHoveredNamespace(hovering ? wt.name : null)}
              connectionActive={hoveredNamespace === 'infra'}
              hasAppeared={hasAppeared}
            />
          ))}
        </div>
      </div>

      {/* Explanation text */}
      <div className="mt-8 text-center">
        <p className="text-xs font-mono text-dubois-charcoal">
          Hover over boxes to highlight connections
        </p>
      </div>
    </div>
  );
};

export default NamespaceArchitecture;
