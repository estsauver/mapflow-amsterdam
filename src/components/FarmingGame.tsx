import React, { useState, useEffect } from 'react';

// Game scene types
type GameScene = 'intro' | 'loan_offer' | 'planting' | 'growing' | 'harvest' | 'success';

interface DialogueState {
  speaker: string;
  text: string;
  showNext: boolean;
}

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
    { speaker: 'SYSTEM', text: '🌽 HARVESTED: 15 bags of maize', showNext: true },
    { speaker: 'SYSTEM', text: '💰 SOLD: 12 bags @ KES 3,500 each', showNext: true },
    { speaker: 'SYSTEM', text: '✅ LOAN REPAID: KES 8,500', showNext: true },
    { speaker: 'SYSTEM', text: '💵 PROFIT: KES 33,500', showNext: true },
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
const FarmerSprite: React.FC<{ variant?: 'farmer' | 'agent'; emotion?: 'neutral' | 'happy' | 'thinking' }> = ({
  variant = 'farmer',
  emotion = 'neutral'
}) => {
  const skinColor = '#8B6914';
  const shirtColor = variant === 'agent' ? '#4ADE80' : '#F59E0B';
  const pantsColor = variant === 'agent' ? '#1F2937' : '#7C3AED';

  return (
    <div className="pixel-sprite relative" style={{ imageRendering: 'pixelated' }}>
      <svg width="48" height="64" viewBox="0 0 12 16" className="crisp-edges">
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
const CropSprite: React.FC<{ stage: 'seed' | 'sprout' | 'growing' | 'mature' }> = ({ stage }) => {
  return (
    <div className="pixel-sprite" style={{ imageRendering: 'pixelated' }}>
      <svg width="24" height="32" viewBox="0 0 6 8" className="crisp-edges">
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

// Game background based on scene
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

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
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
        className="absolute rounded-full"
        style={{
          width: '40px',
          height: '40px',
          background: '#FCD34D',
          top: scene === 'intro' ? '60%' : '15%',
          right: '15%',
          boxShadow: '0 0 20px #FCD34D',
          transition: 'top 1s ease-in-out'
        }}
      />

      {/* Mountains */}
      <div
        className="absolute bottom-20 left-0 right-0"
        style={{
          height: '60px',
          background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
          clipPath: 'polygon(0% 100%, 10% 40%, 25% 70%, 40% 20%, 55% 60%, 70% 30%, 85% 50%, 100% 10%, 100% 100%)'
        }}
      />

      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '80px',
          background: '#8B4513'
        }}
      />

      {/* Farm rows */}
      <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center gap-1 pb-2">
        {cropStage && Array.from({ length: 8 }).map((_, i) => (
          <CropSprite key={i} stage={cropStage as 'seed' | 'sprout' | 'growing' | 'mature'} />
        ))}
      </div>

      {/* Clouds */}
      <div className="absolute top-8 left-10 w-12 h-4 bg-white/80 rounded-full" />
      <div className="absolute top-6 left-14 w-8 h-3 bg-white/80 rounded-full" />
      <div className="absolute top-12 right-20 w-10 h-3 bg-white/80 rounded-full" />
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
    <div className="absolute bottom-4 left-4 right-4">
      {/* Character portrait area */}
      {showSprite && (
        <div className="absolute -top-20 left-4 z-10">
          <div className="bg-slate-900/90 border-4 border-slate-600 p-2 rounded">
            <FarmerSprite
              variant={getSpeakerVariant(dialogue.speaker)}
              emotion={dialogue.text.includes('?') ? 'thinking' : dialogue.text.includes('!') ? 'happy' : 'neutral'}
            />
          </div>
        </div>
      )}

      {/* Main dialogue box */}
      <div
        className="relative bg-slate-900/95 border-4 border-slate-500 rounded-lg p-4 cursor-pointer hover:border-slate-400 transition-colors"
        onClick={onNext}
        style={{
          boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.3)'
        }}
      >
        {/* Speaker name */}
        <div className={`font-bold mb-2 text-sm tracking-wider ${getSpeakerColor(dialogue.speaker)}`}
          style={{ fontFamily: 'monospace' }}>
          [{dialogue.speaker}]
        </div>

        {/* Dialogue text */}
        <div
          className="text-white text-lg leading-relaxed min-h-[3rem]"
          style={{ fontFamily: 'monospace' }}
        >
          {displayedText}
          {isTyping && <span className="animate-pulse">▌</span>}
        </div>

        {/* Next indicator */}
        {!isTyping && dialogue.showNext && (
          <div className="absolute bottom-2 right-4 text-white animate-bounce">
            ▼
          </div>
        )}

        {/* Click hint */}
        {!isTyping && (
          <div className="absolute bottom-2 left-4 text-slate-500 text-xs" style={{ fontFamily: 'monospace' }}>
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
      credit: sceneIndex >= 2 ? 'ACTIVE' : sceneIndex >= 5 ? 'REPAID' : 'NONE',
      yield: sceneIndex >= 4 ? '+180%' : sceneIndex >= 3 ? '+120%' : '--',
    };
  };

  const stats = getStats();

  return (
    <div
      className="absolute top-4 left-4 bg-slate-900/90 border-2 border-slate-600 rounded p-3"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="text-green-400 text-xs mb-2 font-bold">═══ FARM STATUS ═══</div>
      <div className="text-white text-xs space-y-1">
        <div>📍 {stats.location}</div>
        <div>🌱 Season: {stats.season}</div>
        <div>📅 Year: {stats.year}</div>
        <div className={stats.credit === 'ACTIVE' ? 'text-amber-400' : stats.credit === 'REPAID' ? 'text-green-400' : 'text-slate-500'}>
          💳 Credit: {stats.credit}
        </div>
        <div className={stats.yield !== '--' ? 'text-green-400' : 'text-slate-500'}>
          📈 Yield: {stats.yield}
        </div>
      </div>
    </div>
  );
};

// Apollo logo badge
const ApolloBadge: React.FC = () => (
  <div
    className="absolute top-4 right-4 bg-green-600/90 border-2 border-green-400 rounded-lg px-3 py-2"
    style={{ fontFamily: 'monospace' }}
  >
    <div className="text-white text-xs font-bold tracking-widest">APOLLO</div>
    <div className="text-green-200 text-[10px]">AGRICULTURE</div>
  </div>
);

// Main component
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
      // Skip typing animation
      setDisplayedText(currentDialogue.text);
      setIsTyping(false);
      return;
    }

    if (dialogueIndex < currentDialogues.length - 1) {
      // Next dialogue in current scene
      setDialogueIndex(prev => prev + 1);
    } else if (currentSceneIndex < SCENE_ORDER.length - 1) {
      // Next scene
      setCurrentSceneIndex(prev => prev + 1);
      setDialogueIndex(0);
    } else {
      // Loop back to beginning
      setCurrentSceneIndex(0);
      setDialogueIndex(0);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };

  return (
    <div
      className="relative w-full max-w-2xl mx-auto aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border-4 border-slate-700"
      style={{
        imageRendering: 'pixelated',
        boxShadow: '0 0 0 4px #1e293b, 0 0 0 8px #0f172a, 0 20px 60px rgba(0,0,0,0.5)'
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)',
          mixBlendMode: 'multiply'
        }}
      />

      {/* CRT curve effect */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
        }}
      />

      {/* Game content */}
      <div className="relative w-full h-full">
        <GameBackground scene={currentScene} />
        <StatsDisplay scene={currentScene} />
        <ApolloBadge />

        {currentDialogue && (
          <DialogueBox
            dialogue={currentDialogue}
            onNext={handleNext}
            isTyping={isTyping}
            displayedText={displayedText}
          />
        )}
      </div>

      {/* Auto-play toggle */}
      <button
        onClick={toggleAutoPlay}
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 border-2 border-slate-600 rounded px-3 py-1 text-xs text-white hover:bg-slate-700 transition-colors z-30"
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
