import React, { useState, useEffect } from 'react';

// Game scene types
type GameScene = 'intro' | 'loan_offer' | 'planting' | 'growing' | 'harvest' | 'success';

interface DialogueState {
  speaker: string;
  text: string;
  showNext: boolean;
}

// Unit economics data (fictional)
interface Economics {
  costs: {
    seeds: number;
    fertilizer: number;
    labor: number;
    apolloFee: number;
    interest: number;
  };
  revenue: {
    yield: number;
    pricePerBag: number;
    bagsKept: number;
  };
}

const ECONOMICS: Economics = {
  costs: {
    seeds: 2400,      // KES for 5kg hybrid seeds
    fertilizer: 4800, // KES for 20kg total
    labor: 3500,      // KES for season
    apolloFee: 800,   // Service/delivery fee
    interest: 1200,   // Credit interest
  },
  revenue: {
    yield: 18,        // Bags of maize
    pricePerBag: 3800, // KES per 90kg bag
    bagsKept: 3,      // For family consumption
  }
};

const GAME_SCENES: Record<GameScene, DialogueState[]> = {
  intro: [
    { speaker: 'NARRATOR', text: 'NAKURU COUNTY, KENYA...', showNext: true },
    { speaker: 'WANJIKU', text: 'Another season approaches... but seeds are expensive this year.', showNext: true },
    { speaker: 'WANJIKU', text: 'How will I afford quality seeds AND fertilizer?', showNext: true },
  ],
  loan_offer: [
    { speaker: 'APOLLO AGENT', text: 'Hello! I\'m from Apollo Agriculture.', showNext: true },
    { speaker: 'APOLLO AGENT', text: 'We can provide you with certified seeds and fertilizer on credit!', showNext: true },
    { speaker: 'WANJIKU', text: 'On credit? Tell me more...', showNext: true },
    { speaker: 'APOLLO AGENT', text: 'Pay after harvest! We also provide guidance via SMS.', showNext: true },
    { speaker: 'WANJIKU', text: 'This could change everything for my family!', showNext: true },
  ],
  planting: [
    { speaker: 'NARRATOR', text: 'Wanjiku receives her package...', showNext: true },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: Hybrid Maize Seeds (5kg)', showNext: true },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: DAP Fertilizer (10kg)', showNext: true },
    { speaker: 'SYSTEM', text: '📦 RECEIVED: CAN Top-dress (10kg)', showNext: true },
    { speaker: 'WANJIKU', text: 'Time to plant! These seeds look healthy.', showNext: true },
  ],
  growing: [
    { speaker: 'NARRATOR', text: '3 months later...', showNext: true },
    { speaker: 'SMS', text: '📱 APOLLO: Apply top-dress now. Rain expected Thursday.', showNext: true },
    { speaker: 'WANJIKU', text: 'The SMS alerts really help with timing!', showNext: true },
    { speaker: 'NARRATOR', text: 'The crops grow strong and tall...', showNext: true },
  ],
  harvest: [
    { speaker: 'NARRATOR', text: 'HARVEST TIME', showNext: true },
    { speaker: 'WANJIKU', text: 'Look at this yield! Best harvest in years!', showNext: true },
    { speaker: 'SYSTEM', text: `🌽 HARVESTED: ${ECONOMICS.revenue.yield} bags of maize`, showNext: true },
    { speaker: 'SYSTEM', text: `💰 SOLD: ${ECONOMICS.revenue.yield - ECONOMICS.revenue.bagsKept} bags @ KES ${ECONOMICS.revenue.pricePerBag.toLocaleString()} each`, showNext: true },
    { speaker: 'SYSTEM', text: `✅ LOAN REPAID: KES ${(ECONOMICS.costs.seeds + ECONOMICS.costs.fertilizer + ECONOMICS.costs.apolloFee + ECONOMICS.costs.interest).toLocaleString()}`, showNext: true },
    { speaker: 'SYSTEM', text: `💵 NET PROFIT: KES ${(((ECONOMICS.revenue.yield - ECONOMICS.revenue.bagsKept) * ECONOMICS.revenue.pricePerBag) - (ECONOMICS.costs.seeds + ECONOMICS.costs.fertilizer + ECONOMICS.costs.labor + ECONOMICS.costs.apolloFee + ECONOMICS.costs.interest)).toLocaleString()}`, showNext: true },
  ],
  success: [
    { speaker: 'WANJIKU', text: 'I can pay school fees AND save for next season!', showNext: true },
    { speaker: 'APOLLO AGENT', text: 'Your credit score has improved. Larger loan available next season!', showNext: true },
    { speaker: 'WANJIKU', text: 'Maybe I can expand to 2 acres...', showNext: true },
    { speaker: 'NARRATOR', text: '🌟 CYCLE COMPLETE - A BETTER LIFE THROUGH AGRICULTURE 🌟', showNext: false },
  ],
};

const SCENE_ORDER: GameScene[] = ['intro', 'loan_offer', 'planting', 'growing', 'harvest', 'success'];

// Pixel art farmer sprite using CSS
const FarmerSprite: React.FC<{ variant?: 'farmer' | 'agent'; emotion?: 'neutral' | 'happy' | 'thinking'; scale?: number }> = ({
  variant = 'farmer',
  emotion = 'neutral',
  scale = 1
}) => {
  const skinColor = '#8B6914';
  const shirtColor = variant === 'agent' ? '#4ADE80' : '#F59E0B';
  const pantsColor = variant === 'agent' ? '#1F2937' : '#7C3AED';

  return (
    <div className="pixel-sprite relative" style={{ imageRendering: 'pixelated' }}>
      <svg width={48 * scale} height={64 * scale} viewBox="0 0 12 16" className="crisp-edges">
        {/* Hair */}
        <rect x="3" y="0" width="6" height="2" fill="#1a1a1a" />
        <rect x="2" y="1" width="8" height="1" fill="#1a1a1a" />

        {/* Face */}
        <rect x="3" y="2" width="6" height="5" fill={skinColor} />
        <rect x="2" y="3" width="1" height="3" fill={skinColor} />
        <rect x="9" y="3" width="1" height="3" fill={skinColor} />

        {/* Eyes */}
        <rect x="4" y="4" width="1" height="1" fill="#1a1a1a" />
        <rect x="7" y="4" width="1" height="1" fill="#1a1a1a" />

        {/* Mouth */}
        {emotion === 'happy' && <rect x="5" y="6" width="2" height="1" fill="#DC2626" />}
        {emotion === 'neutral' && <rect x="5" y="6" width="2" height="1" fill="#7C2D12" />}
        {emotion === 'thinking' && <rect x="6" y="6" width="1" height="1" fill="#7C2D12" />}

        {/* Body/Shirt */}
        <rect x="3" y="7" width="6" height="4" fill={shirtColor} />
        <rect x="1" y="8" width="2" height="3" fill={shirtColor} />
        <rect x="9" y="8" width="2" height="3" fill={shirtColor} />

        {/* Hands */}
        <rect x="1" y="11" width="2" height="1" fill={skinColor} />
        <rect x="9" y="11" width="2" height="1" fill={skinColor} />

        {/* Pants */}
        <rect x="3" y="11" width="6" height="3" fill={pantsColor} />
        <rect x="4" y="11" width="1" height="3" fill="#1a1a1a" />

        {/* Feet */}
        <rect x="3" y="14" width="2" height="2" fill="#4B3621" />
        <rect x="7" y="14" width="2" height="2" fill="#4B3621" />
      </svg>
    </div>
  );
};

// Crop sprite that grows
const CropSprite: React.FC<{ stage: 'seed' | 'sprout' | 'growing' | 'mature'; scale?: number }> = ({ stage, scale = 1 }) => {
  return (
    <div className="pixel-sprite" style={{ imageRendering: 'pixelated' }}>
      <svg width={24 * scale} height={32 * scale} viewBox="0 0 6 8" className="crisp-edges">
        {stage === 'seed' && (
          <>
            <rect x="2" y="6" width="2" height="1" fill="#8B4513" />
            <rect x="2" y="5" width="2" height="1" fill="#D2691E" />
          </>
        )}
        {stage === 'sprout' && (
          <>
            <rect x="2" y="5" width="2" height="2" fill="#22C55E" />
            <rect x="2" y="7" width="2" height="1" fill="#8B4513" />
          </>
        )}
        {stage === 'growing' && (
          <>
            <rect x="2" y="2" width="2" height="5" fill="#22C55E" />
            <rect x="1" y="3" width="1" height="2" fill="#16A34A" />
            <rect x="4" y="4" width="1" height="2" fill="#16A34A" />
            <rect x="2" y="7" width="2" height="1" fill="#8B4513" />
          </>
        )}
        {stage === 'mature' && (
          <>
            <rect x="2" y="0" width="2" height="7" fill="#22C55E" />
            <rect x="0" y="1" width="2" height="3" fill="#16A34A" />
            <rect x="4" y="2" width="2" height="3" fill="#16A34A" />
            <rect x="1" y="0" width="1" height="2" fill="#FCD34D" />
            <rect x="4" y="0" width="1" height="2" fill="#FCD34D" />
            <rect x="2" y="7" width="2" height="1" fill="#8B4513" />
          </>
        )}
      </svg>
    </div>
  );
};

// Game background based on scene - now fullscreen
const GameBackground: React.FC<{ scene: GameScene }> = ({ scene }) => {
  const getCropStage = () => {
    switch (scene) {
      case 'intro':
      case 'loan_offer':
        return null;
      case 'planting':
        return 'seed';
      case 'growing':
        return 'growing';
      case 'harvest':
      case 'success':
        return 'mature';
      default:
        return null;
    }
  };

  const cropStage = getCropStage();
  const cropCount = 24; // More crops for fullscreen

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: scene === 'intro' ?
            'linear-gradient(180deg, #1e3a5f 0%, #f97316 50%, #fbbf24 100%)' :
            scene === 'harvest' || scene === 'success' ?
            'linear-gradient(180deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)' :
            'linear-gradient(180deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)'
        }}
      />

      {/* Sun */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, #FCD34D 0%, #F59E0B 100%)',
          top: scene === 'intro' ? '50%' : '10%',
          right: '20%',
          boxShadow: '0 0 60px #FCD34D, 0 0 120px #F59E0B',
        }}
      />

      {/* Clouds */}
      <div className="absolute top-[15%] left-[10%] w-32 h-12 bg-white/70 rounded-full blur-sm" />
      <div className="absolute top-[12%] left-[15%] w-24 h-10 bg-white/70 rounded-full blur-sm" />
      <div className="absolute top-[20%] left-[60%] w-40 h-14 bg-white/70 rounded-full blur-sm" />
      <div className="absolute top-[18%] left-[65%] w-28 h-10 bg-white/70 rounded-full blur-sm" />

      {/* Distant mountains */}
      <div
        className="absolute bottom-[30%] left-0 right-0"
        style={{
          height: '200px',
          background: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)',
          clipPath: 'polygon(0% 100%, 5% 60%, 15% 80%, 25% 40%, 35% 70%, 45% 30%, 55% 60%, 65% 20%, 75% 50%, 85% 35%, 95% 55%, 100% 25%, 100% 100%)',
          opacity: 0.6
        }}
      />

      {/* Closer hills */}
      <div
        className="absolute bottom-[20%] left-0 right-0"
        style={{
          height: '150px',
          background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
          clipPath: 'polygon(0% 100%, 10% 50%, 20% 70%, 30% 40%, 45% 65%, 55% 35%, 70% 55%, 80% 45%, 90% 60%, 100% 40%, 100% 100%)'
        }}
      />

      {/* Ground/Field */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '25%',
          background: 'linear-gradient(180deg, #92400E 0%, #78350F 50%, #451A03 100%)'
        }}
      />

      {/* Field rows pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-amber-900/50"
            style={{ bottom: `${15 + i * 15}%` }}
          />
        ))}
      </div>

      {/* Farm crops */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] flex items-end justify-center gap-2 pb-4">
        {cropStage && Array.from({ length: cropCount }).map((_, i) => (
          <CropSprite key={i} stage={cropStage as 'seed' | 'sprout' | 'growing' | 'mature'} scale={2} />
        ))}
      </div>
    </div>
  );
};

// Economics panel
const EconomicsPanel: React.FC<{ scene: GameScene }> = ({ scene }) => {
  const sceneIndex = SCENE_ORDER.indexOf(scene);
  const showCosts = sceneIndex >= 2; // After loan
  const showRevenue = sceneIndex >= 4; // After harvest

  const totalCosts = ECONOMICS.costs.seeds + ECONOMICS.costs.fertilizer + ECONOMICS.costs.labor + ECONOMICS.costs.apolloFee + ECONOMICS.costs.interest;
  const grossRevenue = (ECONOMICS.revenue.yield - ECONOMICS.revenue.bagsKept) * ECONOMICS.revenue.pricePerBag;
  const netProfit = grossRevenue - totalCosts;
  const roi = ((netProfit / totalCosts) * 100).toFixed(0);

  return (
    <div
      className="absolute bottom-32 left-8 bg-slate-900/95 border-2 border-amber-500/50 rounded-lg p-4 min-w-[280px]"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="text-amber-400 text-sm mb-3 font-bold border-b border-amber-500/30 pb-2">
        📊 UNIT ECONOMICS (1 ACRE)*
      </div>

      {/* Costs Section */}
      <div className="mb-3">
        <div className="text-red-400 text-xs font-bold mb-1">COSTS:</div>
        <div className="text-white text-xs space-y-0.5 pl-2">
          <div className="flex justify-between">
            <span className={showCosts ? 'text-white' : 'text-slate-600'}>Hybrid Seeds (5kg)</span>
            <span className={showCosts ? 'text-red-300' : 'text-slate-600'}>
              {showCosts ? `- KES ${ECONOMICS.costs.seeds.toLocaleString()}` : '???'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={showCosts ? 'text-white' : 'text-slate-600'}>Fertilizer (20kg)</span>
            <span className={showCosts ? 'text-red-300' : 'text-slate-600'}>
              {showCosts ? `- KES ${ECONOMICS.costs.fertilizer.toLocaleString()}` : '???'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={showCosts ? 'text-white' : 'text-slate-600'}>Labor</span>
            <span className={showCosts ? 'text-red-300' : 'text-slate-600'}>
              {showCosts ? `- KES ${ECONOMICS.costs.labor.toLocaleString()}` : '???'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={showCosts ? 'text-white' : 'text-slate-600'}>Apollo Fee</span>
            <span className={showCosts ? 'text-red-300' : 'text-slate-600'}>
              {showCosts ? `- KES ${ECONOMICS.costs.apolloFee.toLocaleString()}` : '???'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={showCosts ? 'text-white' : 'text-slate-600'}>Credit Interest</span>
            <span className={showCosts ? 'text-red-300' : 'text-slate-600'}>
              {showCosts ? `- KES ${ECONOMICS.costs.interest.toLocaleString()}` : '???'}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-600 pt-1 mt-1">
            <span className="font-bold">TOTAL COSTS</span>
            <span className={showCosts ? 'text-red-400 font-bold' : 'text-slate-600'}>
              {showCosts ? `- KES ${totalCosts.toLocaleString()}` : '???'}
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="mb-3">
        <div className="text-green-400 text-xs font-bold mb-1">REVENUE:</div>
        <div className="text-white text-xs space-y-0.5 pl-2">
          <div className="flex justify-between">
            <span className={showRevenue ? 'text-white' : 'text-slate-600'}>
              Yield: {showRevenue ? `${ECONOMICS.revenue.yield} bags` : '?? bags'}
            </span>
            <span className="text-slate-500">@ KES {ECONOMICS.revenue.pricePerBag.toLocaleString()}/bag</span>
          </div>
          <div className="flex justify-between">
            <span className={showRevenue ? 'text-white' : 'text-slate-600'}>Family keeps</span>
            <span className={showRevenue ? 'text-slate-400' : 'text-slate-600'}>
              {showRevenue ? `${ECONOMICS.revenue.bagsKept} bags` : '?'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={showRevenue ? 'text-white' : 'text-slate-600'}>Sold to market</span>
            <span className={showRevenue ? 'text-green-300' : 'text-slate-600'}>
              {showRevenue ? `${ECONOMICS.revenue.yield - ECONOMICS.revenue.bagsKept} bags` : '?'}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-600 pt-1 mt-1">
            <span className="font-bold">GROSS REVENUE</span>
            <span className={showRevenue ? 'text-green-400 font-bold' : 'text-slate-600'}>
              {showRevenue ? `+ KES ${grossRevenue.toLocaleString()}` : '???'}
            </span>
          </div>
        </div>
      </div>

      {/* Profit Section */}
      <div className="border-t-2 border-amber-500/50 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-amber-400 font-bold">NET PROFIT</span>
          <span className={showRevenue ? 'text-green-400 font-bold' : 'text-slate-600'}>
            {showRevenue ? `KES ${netProfit.toLocaleString()}` : '???'}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-slate-400">Return on Investment</span>
          <span className={showRevenue ? 'text-cyan-400 font-bold' : 'text-slate-600'}>
            {showRevenue ? `${roi}%` : '???'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Dialogue box component
const DialogueBox: React.FC<{
  dialogue: DialogueState;
  onNext: () => void;
  isTyping: boolean;
  displayedText: string;
}> = ({ dialogue, onNext, isTyping, displayedText }) => {
  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'WANJIKU': return 'text-amber-400';
      case 'APOLLO AGENT': return 'text-green-400';
      case 'NARRATOR': return 'text-purple-400';
      case 'SYSTEM': return 'text-cyan-400';
      case 'SMS': return 'text-blue-400';
      default: return 'text-white';
    }
  };

  const getSpeakerVariant = (speaker: string): 'farmer' | 'agent' => {
    return speaker === 'APOLLO AGENT' ? 'agent' : 'farmer';
  };

  const showSprite = ['WANJIKU', 'APOLLO AGENT'].includes(dialogue.speaker);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8">
      {/* Character portrait area */}
      {showSprite && (
        <div className="absolute -top-24 left-12 z-10">
          <div className="bg-slate-900/90 border-4 border-slate-600 p-3 rounded">
            <FarmerSprite
              variant={getSpeakerVariant(dialogue.speaker)}
              emotion={dialogue.text.includes('?') ? 'thinking' : dialogue.text.includes('!') ? 'happy' : 'neutral'}
              scale={1.5}
            />
          </div>
        </div>
      )}

      {/* Main dialogue box */}
      <div
        className="relative bg-slate-900/95 border-4 border-slate-500 rounded-lg p-6 cursor-pointer hover:border-slate-400 transition-colors"
        onClick={onNext}
        style={{
          boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.3), 0 10px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Speaker name */}
        <div className={`font-bold mb-2 text-sm tracking-wider ${getSpeakerColor(dialogue.speaker)}`}
          style={{ fontFamily: 'monospace' }}>
          [{dialogue.speaker}]
        </div>

        {/* Dialogue text */}
        <div
          className="text-white text-xl leading-relaxed min-h-[4rem]"
          style={{ fontFamily: 'monospace' }}
        >
          {displayedText}
          {isTyping && <span className="animate-pulse">▌</span>}
        </div>

        {/* Next indicator */}
        {!isTyping && dialogue.showNext && (
          <div className="absolute bottom-3 right-6 text-white animate-bounce text-xl">
            ▼
          </div>
        )}

        {/* Click hint */}
        {!isTyping && (
          <div className="absolute bottom-3 left-6 text-slate-500 text-xs" style={{ fontFamily: 'monospace' }}>
            [CLICK TO CONTINUE]
          </div>
        )}
      </div>
    </div>
  );
};

// Stats display
const StatsDisplay: React.FC<{ scene: GameScene }> = ({ scene }) => {
  const getStats = () => {
    const sceneIndex = SCENE_ORDER.indexOf(scene);
    return {
      season: 'Long Rains',
      year: '2024',
      location: 'Nakuru, Kenya',
      credit: sceneIndex >= 2 ? (sceneIndex >= 5 ? 'REPAID' : 'ACTIVE') : 'NONE',
      yield: sceneIndex >= 4 ? '+180%' : sceneIndex >= 3 ? '+120%' : '--',
    };
  };

  const stats = getStats();

  return (
    <div
      className="absolute top-8 left-8 bg-slate-900/90 border-2 border-slate-600 rounded-lg p-4"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="text-green-400 text-sm mb-3 font-bold">═══ FARM STATUS ═══</div>
      <div className="text-white text-sm space-y-1">
        <div>📍 {stats.location}</div>
        <div>🌱 Season: {stats.season}</div>
        <div>📅 Year: {stats.year}</div>
        <div className={stats.credit === 'ACTIVE' ? 'text-amber-400' : stats.credit === 'REPAID' ? 'text-green-400' : 'text-slate-500'}>
          💳 Credit: {stats.credit}
        </div>
        <div className={stats.yield !== '--' ? 'text-green-400' : 'text-slate-500'}>
          📈 Yield vs Traditional: {stats.yield}
        </div>
      </div>
    </div>
  );
};

// Apollo logo badge
const ApolloBadge: React.FC = () => (
  <div
    className="absolute top-8 left-1/2 -translate-x-1/2 bg-green-600/90 border-2 border-green-400 rounded-lg px-6 py-3"
    style={{ fontFamily: 'monospace' }}
  >
    <div className="text-white text-lg font-bold tracking-widest text-center">APOLLO FARMER</div>
    <div className="text-green-200 text-xs text-center">SEEDS OF PROSPERITY</div>
  </div>
);

// Disclaimer footer
const Disclaimer: React.FC = () => (
  <div
    className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center max-w-3xl px-4"
    style={{ fontFamily: 'monospace' }}
  >
    <p className="text-slate-500 text-[10px] leading-tight">
      * These unit economics are entirely fictional and for illustrative purposes only.
      If you want real numbers, go do the work and bring some competition to the space.
      Smallholder farmers deserve more options.
    </p>
  </div>
);

// Main component - now fullscreen
const FarmingGame: React.FC = () => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentScene = SCENE_ORDER[currentSceneIndex];
  const currentDialogues = GAME_SCENES[currentScene];
  const currentDialogue = currentDialogues[dialogueIndex];

  // Typewriter effect
  useEffect(() => {
    if (!currentDialogue) return;

    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const text = currentDialogue.text;

    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setDisplayedText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [currentDialogue, currentSceneIndex, dialogueIndex]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || isTyping) return;

    const autoAdvance = setTimeout(() => {
      handleNext();
    }, 2500);

    return () => clearTimeout(autoAdvance);
  }, [isAutoPlaying, isTyping, dialogueIndex, currentSceneIndex]);

  const handleNext = () => {
    if (isTyping) {
      setDisplayedText(currentDialogue.text);
      setIsTyping(false);
      return;
    }

    if (dialogueIndex < currentDialogues.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else if (currentSceneIndex < SCENE_ORDER.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setDialogueIndex(0);
    } else {
      setCurrentSceneIndex(0);
      setDialogueIndex(0);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };

  return (
    <div className="fixed inset-0 bg-slate-950" style={{ imageRendering: 'pixelated' }}>
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* CRT vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Game content */}
      <div className="relative w-full h-full" onClick={handleNext}>
        <GameBackground scene={currentScene} />
        <StatsDisplay scene={currentScene} />
        <EconomicsPanel scene={currentScene} />
        <ApolloBadge />

        {currentDialogue && (
          <DialogueBox
            dialogue={currentDialogue}
            onNext={handleNext}
            isTyping={isTyping}
            displayedText={displayedText}
          />
        )}

        <Disclaimer />
      </div>

      {/* Auto-play toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleAutoPlay(); }}
        className="absolute top-8 right-8 bg-slate-800/90 border-2 border-slate-600 rounded px-4 py-2 text-sm text-white hover:bg-slate-700 transition-colors z-30"
        style={{ fontFamily: 'monospace' }}
      >
        {isAutoPlaying ? '⏸ PAUSE' : '▶ AUTO'}
      </button>

      {/* Scene progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 z-30">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{
            width: `${((currentSceneIndex * 10 + dialogueIndex) / (SCENE_ORDER.length * 5)) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

export default FarmingGame;
