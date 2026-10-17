import { describe, it, expect } from 'vitest';
import { RecordingPainter } from '../console/RecordingPainter';
import { runProgram } from '../console/runProgram';
import type { GameProgram, Input, Painter } from '../console/types';

const demo = (): GameProgram => {
  let clicks = 0;
  let t = 0;
  return {
    id: 'demo',
    update(dt: number, input: Input) {
      t += dt;
      if (input.pointer.justPressed) clicks++;
      if (input.keysJustPressed.has('Enter')) clicks += 10;
    },
    draw(p: Painter) {
      p.clear('#000');
      p.layer(2);
      p.text(`clicks ${clicks}`, 10, 10, { size: 16, color: '#fff' });
      if (t > 1) p.text('one second', p.width / 2, p.height / 2, { size: 20, color: '#0f0', align: 'center' });
      p.sprite({ rows: ['ab', 'ba'], palette: { a: '#f00', b: '#00f' } }, 50, 50, { scale: 4 });
    },
  };
};

describe('RecordingPainter', () => {
  it('records text, sprites and layers with logical coordinates', () => {
    const p = new RecordingPainter(960, 540);
    p.beginFrame(0);
    p.layer(1);
    p.text('hi', 1, 2, { size: 12, color: '#fff' });
    p.layer(0);
    p.sprite({ rows: ['a'], palette: { a: '#fff' } }, 3, 4);
    expect(p.texts).toEqual([{ text: 'hi', x: 1, y: 2, layer: 1, frame: 0 }]);
    expect(p.sprites).toHaveLength(1);
    expect(p.sprites[0]).toMatchObject({ x: 3, y: 4, layer: 0, frame: 0 });
    expect(p.measureText('abcd', { size: 10 })).toBeGreaterThan(0);
  });
});

describe('runProgram', () => {
  it('steps a program with simulated time, clicks and keys and collects what it drew', () => {
    const r = runProgram(demo, {
      seconds: 2,
      fps: 60,
      clicks: [{ at: 0.5, x: 100, y: 100 }, { at: 0.6, x: 100, y: 100 }],
      keys: [{ at: 1.5, key: 'Enter' }],
    });
    expect(r.frames).toBe(120);
    expect(r.errors).toEqual([]);
    expect(r.textsSeen.has('one second')).toBe(true);
    expect(r.textsSeen.has('clicks 12')).toBe(true);
    expect(r.lastTexts.map(t => t.text)).toContain('clicks 12');
  });

  it('captures exceptions instead of aborting the run', () => {
    const boom = (): GameProgram => ({
      id: 'boom',
      update() {},
      draw() {
        throw new Error('draw failed');
      },
    });
    const r = runProgram(boom, { seconds: 0.1, fps: 10 });
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0]).toMatch(/draw failed/);
  });
});
