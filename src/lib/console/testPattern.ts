import type { GameFactory, PixelSprite } from './types';

const FARMER: PixelSprite = {
  rows: [
    '....hhhh....',
    '...hhhhhh...',
    '...hssssh...',
    '...seseess..',
    '...ssssss...',
    '....ssss....',
    '..ooooooooo.',
    '.oooooooooo.',
    '.ooosoooosoo',
    '.ooosoooosoo',
    '..ooooooooo.',
    '...pppppp...',
    '...pp..pp...',
    '...pp..pp...',
    '...bb..bb...',
    '..bbb..bbb..',
  ],
  palette: { h: '#78350f', s: '#f5c6a0', e: '#111827', o: '#f59e0b', p: '#7c3aed', b: '#1f2937' },
};

/** Development aid: exercises every Painter primitive so the pipeline can be checked by eye. */
export const createTestPattern: GameFactory = () => {
  let clicks = 0;
  let x = 0;
  return {
    id: 'test-pattern',
    update(dt, input) {
      if (input.pointer.justPressed) clicks++;
      x = (x + dt * 90) % 2000;
    },
    draw(p) {
      p.layer(0);
      p.gradient(0, 0, p.width, p.height, [[0, '#1e3a5f'], [0.55, '#f97316'], [1, '#fbbf24']]);
      p.glow(p.width * 0.78, 110, 170, '#fde047', 0.9);
      p.circle(p.width * 0.78, 110, 52, '#fde047');
      p.polygon([[0, 330], [p.width * 0.22, 200], [p.width * 0.4, 310], [p.width * 0.58, 180], [p.width * 0.8, 300], [p.width, 230], [p.width, 360], [0, 360]], '#047857');
      p.polygon([[0, 360], [p.width * 0.3, 280], [p.width * 0.55, 350], [p.width * 0.75, 300], [p.width, 345], [p.width, 400], [0, 400]], '#34d399');

      p.layer(1);
      p.gradient(0, 390, p.width, 150, [[0, '#92400e'], [1, '#451a03']]);
      for (let i = 0; i < 12; i++) {
        const cx = 40 + i * 80;
        p.rect(cx, 420, 10, 50, '#16a34a');
        p.circle(cx + 5, 418, 9, '#22c55e');
      }
      p.sprite(FARMER, 120 + (x % (p.width - 200)), 330, { scale: 4 });
      p.path('M10 30 A20 20 0 0 1 50 30 A20 20 0 0 1 90 30 Q90 60 50 90 Q10 60 10 30 Z', p.width - 160, 380, 0.9, { fill: '#e11d48', stroke: '#881337', lineWidth: 3 });

      p.layer(2);
      p.box(16, 16, 250, 120, { fill: 'rgba(15,23,42,0.9)', stroke: '#475569', lineWidth: 2 });
      p.text('── FARM STATUS ──', 28, 26, { size: 14, color: '#94a3b8' });
      p.text('📍 Nakuru, Kenya', 28, 50, { size: 16, color: '#ffffff' });
      p.text('🌱 Season: Long Rains', 28, 74, { size: 16, color: '#4ade80' });
      p.text(`clicks ${clicks}`, 28, 100, { size: 16, color: '#fbbf24' });
      const sizes = [12, 16, 20, 28, 40];
      let y = 150;
      for (const s of sizes) {
        p.text(`Mono ${s}px The quick brown fox`, 16, y, { size: s, color: '#ffffff', shadow: 'rgba(0,0,0,0.8)' });
        y += s * 1.5;
      }
      p.text('Serif 28px Once upon a time', 16, y + 10, { size: 28, color: '#fef3c7', font: 'serif' });
      p.box(p.width / 2 - 260, p.height - 120, 520, 90, { fill: 'rgba(15,23,42,0.92)', stroke: '#475569', radius: 4 });
      p.text('[NARRATOR]', p.width / 2 - 244, p.height - 108, { size: 13, color: '#64748b' });
      p.textBlock('NAKURU COUNTY, KENYA... A place where the rains decide everything.', p.width / 2 - 244, p.height - 88, { size: 20, color: '#ffffff', maxWidth: 490 });
      p.box(p.width - 110, p.height - 44, 94, 30, { fill: 'rgba(30,41,59,0.9)', stroke: '#475569' });
      p.text('⏸ PAUSE', p.width - 100, p.height - 37, { size: 13, color: '#ffffff' });
    },
  };
};
