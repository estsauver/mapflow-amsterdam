import React, { useState, useEffect, useCallback } from 'react';

type GameScene = 'boot' | 'input' | 'sampling' | 'distribution' | 'risks' | 'shuttered';

interface Sample {
  id: number;
  x: number;
  y: number;
  targetBucket: number;
  landed: boolean;
}

interface RiskFactor {
  name: string;
  impact: string;
  probability: string;
  revealed: boolean;
}

const DISTRIBUTION_BUCKETS = [
  { days: 1, height: 5, label: '1d' },
  { days: 2, height: 15, label: '2d' },
  { days: 3, height: 35, label: '3d' },
  { days: 4, height: 25, label: '4d' },
  { days: 5, height: 45, label: '5d' },
  { days: 6, height: 30, label: '6d' },
  { days: 7, height: 20, label: '7d' },
  { days: 8, height: 15, label: '8d' },
  { days: 10, height: 8, label: '10d' },
  { days: 14, height: 4, label: '14d' },
];

const RISK_FACTORS: RiskFactor[] = [
  { name: 'Auth library integration', impact: '+2d', probability: '30%', revealed: false },
  { name: 'Unclear requirements', impact: '+3d', probability: '45%', revealed: false },
  { name: 'Testing edge cases', impact: '+1d', probability: '60%', revealed: false },
  { name: 'Code review cycles', impact: '+1d', probability: '40%', revealed: false },
];

const EstimatorGame: React.FC = () => {
  const [scene, setScene] = useState<GameScene>('boot');
  const [bootText, setBootText] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [bucketHeights, setBucketHeights] = useState<number[]>(DISTRIBUTION_BUCKETS.map(() => 0));
  const [revealedRisks, setRevealedRisks] = useState<number>(0);
  const [showPercentiles, setShowPercentiles] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Boot sequence
  useEffect(() => {
    if (scene !== 'boot') return;

    const bootMessages = [
      'UNIVERSAL ESTIMATOR v2.1.0',
      '(c) 2025 - Probability Systems Inc.',
      '',
      'Initializing token probability engine...',
      'Loading distribution models... OK',
      'Calibrating uncertainty bounds... OK',
      '',
      'READY.',
      '',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < bootMessages.length) {
        setBootText(prev => [...prev, bootMessages[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setScene('input'), 500);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [scene]);

  // Input typing effect
  useEffect(() => {
    if (scene !== 'input') return;

    const fullText = 'ESTIMATE: Build user login system';
    let index = 0;

    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setInputText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setScene('sampling'), 1000);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [scene]);

  // Sampling animation
  useEffect(() => {
    if (scene !== 'sampling') return;

    let sampleId = 0;
    const totalSamples = 50;

    const interval = setInterval(() => {
      if (sampleId < totalSamples) {
        // Weighted random bucket selection (skewed right)
        const weights = [5, 15, 35, 25, 45, 30, 20, 15, 8, 4];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let bucketIndex = 0;
        for (let i = 0; i < weights.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            bucketIndex = i;
            break;
          }
        }

        const newSample: Sample = {
          id: sampleId,
          x: Math.random() * 80 + 10,
          y: 0,
          targetBucket: bucketIndex,
          landed: false,
        };

        setSamples(prev => [...prev, newSample]);

        // Update bucket height after delay
        setTimeout(() => {
          setBucketHeights(prev => {
            const newHeights = [...prev];
            newHeights[bucketIndex] = Math.min(newHeights[bucketIndex] + 3, 100);
            return newHeights;
          });
          setSamples(prev => prev.map(s =>
            s.id === newSample.id ? { ...s, landed: true } : s
          ));
        }, 400);

        sampleId++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowPercentiles(true);
          setTimeout(() => setScene('distribution'), 2000);
        }, 500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [scene]);

  // Risk reveal animation
  useEffect(() => {
    if (scene !== 'risks') return;

    const interval = setInterval(() => {
      setRevealedRisks(prev => {
        if (prev < RISK_FACTORS.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => setScene('shuttered'), 3000);
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(interval);
  }, [scene]);

  // Distribution to risks transition
  useEffect(() => {
    if (scene !== 'distribution') return;

    const timeout = setTimeout(() => {
      setScene('risks');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [scene]);

  const renderTerminalHeader = () => (
    <div className="border-b border-green-900 pb-2 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
        <span className="ml-4 text-green-600 text-sm">UNIVERSAL ESTIMATOR</span>
      </div>
    </div>
  );

  const renderBootScene = () => (
    <div className="font-mono text-green-500 text-sm leading-relaxed">
      {bootText.map((line, i) => (
        <div key={i} className={line === '' ? 'h-4' : ''}>
          {line}
        </div>
      ))}
      <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>█</span>
    </div>
  );

  const renderInputScene = () => (
    <div className="font-mono text-sm leading-relaxed">
      {bootText.map((line, i) => (
        <div key={i} className={`text-green-700 ${line === '' ? 'h-4' : ''}`}>
          {line}
        </div>
      ))}
      <div className="mt-4 text-amber-400">
        {'>'} {inputText}
        <span className={cursorVisible ? 'opacity-100' : 'opacity-0'}>█</span>
      </div>
    </div>
  );

  const renderSamplingScene = () => (
    <div className="font-mono text-sm">
      <div className="text-green-600 mb-2">{'>'} {inputText}</div>
      <div className="text-amber-400 mb-4">
        Sampling probability distributions...
        <span className="animate-pulse"> ({samples.filter(s => s.landed).length}/50 samples)</span>
      </div>

      {/* Histogram visualization */}
      <div className="relative h-48 mt-8 border-l border-b border-green-800 ml-8">
        {/* Y-axis label */}
        <div className="absolute -left-8 top-1/2 -rotate-90 text-green-600 text-xs">
          PROBABILITY
        </div>

        {/* Buckets */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around items-end h-full px-2">
          {DISTRIBUTION_BUCKETS.map((bucket, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className="w-6 bg-green-500 transition-all duration-300 ease-out"
                style={{
                  height: `${bucketHeights[i] * 1.5}px`,
                  opacity: bucketHeights[i] > 0 ? 0.8 : 0,
                  boxShadow: bucketHeights[i] > 0 ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
                }}
              />
              <span className="text-green-600 text-xs mt-1">{bucket.label}</span>
            </div>
          ))}
        </div>

        {/* Falling samples */}
        {samples.filter(s => !s.landed).map(sample => (
          <div
            key={sample.id}
            className="absolute w-2 h-2 bg-amber-400 rounded-full animate-ping"
            style={{
              left: `${10 + sample.targetBucket * 9}%`,
              top: '0%',
              animation: 'fall 0.4s ease-in forwards',
            }}
          />
        ))}
      </div>

      {/* Percentiles */}
      {showPercentiles && (
        <div className="mt-6 text-green-400 space-y-1 animate-pulse">
          <div>├─ 50th percentile: <span className="text-amber-400">3 days</span></div>
          <div>├─ 80th percentile: <span className="text-amber-400">5 days</span></div>
          <div>└─ 95th percentile: <span className="text-red-400">8+ days</span> ⚠️</div>
        </div>
      )}
    </div>
  );

  const renderDistributionScene = () => (
    <div className="font-mono text-sm">
      <div className="text-green-600 mb-2">{'>'} ESTIMATE: Build user login system</div>

      <div className="bg-green-950/50 border border-green-800 rounded p-4 mt-4">
        <div className="text-amber-400 text-lg mb-4">
          ╔══════════════════════════════════════╗
          <br />
          ║  PROBABILITY DISTRIBUTION COMPLETE   ║
          <br />
          ╚══════════════════════════════════════╝
        </div>

        <div className="grid grid-cols-2 gap-4 text-green-400">
          <div>
            <div className="text-green-600 text-xs mb-1">POINT ESTIMATE</div>
            <div className="text-2xl line-through text-red-500/70">3 days</div>
            <div className="text-xs text-red-400">← This is a lie</div>
          </div>
          <div>
            <div className="text-green-600 text-xs mb-1">REALISTIC RANGE</div>
            <div className="text-2xl text-green-400">3-8 days</div>
            <div className="text-xs text-green-600">← This is truth</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-800">
          <div className="text-amber-400">The distribution reveals what point estimates hide.</div>
        </div>
      </div>

      <div className="mt-4 text-green-600 animate-pulse">
        Analyzing risk factors...
      </div>
    </div>
  );

  const renderRisksScene = () => (
    <div className="font-mono text-sm">
      <div className="text-green-600 mb-2">{'>'} ESTIMATE: Build user login system</div>

      <div className="bg-red-950/30 border border-red-800/50 rounded p-4 mt-4">
        <div className="text-red-400 mb-4 flex items-center gap-2">
          <span className="animate-pulse">⚠️</span>
          RISK FACTORS DETECTED:
        </div>

        <div className="space-y-2">
          {RISK_FACTORS.slice(0, revealedRisks).map((risk, i) => (
            <div
              key={i}
              className="flex justify-between text-green-400 animate-fadeIn"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <span className="text-amber-400">{'>'}</span>
              <span className="flex-1 mx-2">{risk.name}</span>
              <span className="text-red-400 w-16">{risk.impact}</span>
              <span className="text-green-600 w-16 text-right">({risk.probability})</span>
            </div>
          ))}
        </div>

        {revealedRisks >= RISK_FACTORS.length && (
          <div className="mt-4 pt-4 border-t border-red-800/50 text-amber-400">
            <div>Total potential delay: +7 days</div>
            <div className="text-green-600 text-xs mt-2">
              Risk-adjusted estimate: 3-10 days (95% confidence)
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderShutteredScene = () => (
    <div className="font-mono text-sm flex flex-col items-center justify-center h-full">
      <div className="text-center space-y-6">
        <div className="text-green-800 text-6xl mb-4">⏻</div>

        <div className="text-green-600 space-y-1">
          <div>UNIVERSAL ESTIMATOR</div>
          <div className="text-green-800">━━━━━━━━━━━━━━━━━━━━</div>
        </div>

        <div className="text-amber-600/80 text-lg">
          PROJECT SHUT DOWN
        </div>
        <div className="text-green-800">
          2025
        </div>

        <div className="mt-8 text-green-700 text-xs max-w-md leading-relaxed">
          <p>
            "Point estimates are comfortable lies.
          </p>
          <p>
            Distributions are uncomfortable truths."
          </p>
        </div>

        <div className="mt-6 text-green-900 text-xs">
          Thanks for exploring.
        </div>
      </div>

      {/* Subtle CRT flicker effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-pulse" />
      </div>
    </div>
  );

  const renderScene = () => {
    switch (scene) {
      case 'boot':
        return renderBootScene();
      case 'input':
        return renderInputScene();
      case 'sampling':
        return renderSamplingScene();
      case 'distribution':
        return renderDistributionScene();
      case 'risks':
        return renderRisksScene();
      case 'shuttered':
        return renderShutteredScene();
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* CRT screen effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 to-black pointer-events-none" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
        }}
      />

      {/* Screen curvature effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.5)',
          borderRadius: '20px',
        }}
      />

      {/* Terminal content */}
      <div className="relative z-10 p-8 h-full flex flex-col">
        {renderTerminalHeader()}
        <div className="flex-1 overflow-hidden">
          {renderScene()}
        </div>
      </div>

      {/* Phosphor glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 255, 0, 0.03) 0%, transparent 70%)',
        }}
      />

      <style>{`
        @keyframes fall {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(180px);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default EstimatorGame;
