import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlackHoleRenderer } from '../blackhole/BlackHoleRenderer';

// A WebGL2 stand-in: every method is a counter, enums are stable numbers,
// status queries report success. Enough to drive the renderer's lifecycle.
const ENUMS: Record<string, number> = {
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
  QUERY_RESULT_AVAILABLE: 0x8867,
  QUERY_RESULT: 0x8866,
};

function makeGL() {
  const calls: Record<string, number> = {};
  const gl = new Proxy({} as Record<string, unknown>, {
    get(_, prop) {
      if (typeof prop !== 'string') return undefined;
      if (prop in ENUMS) return ENUMS[prop];
      if (/^[A-Z][A-Z0-9_]*$/.test(prop)) return 1;
      return (..._args: unknown[]) => {
        calls[prop] = (calls[prop] ?? 0) + 1;
        switch (prop) {
          case 'getShaderParameter':
          case 'getProgramParameter':
            return true;
          case 'checkFramebufferStatus':
            return ENUMS.FRAMEBUFFER_COMPLETE;
          case 'getExtension':
            return null;
          case 'isContextLost':
            return false;
          case 'getParameter':
            return 0;
          case 'createShader':
          case 'createProgram':
          case 'createTexture':
          case 'createFramebuffer':
          case 'createQuery':
          case 'getUniformLocation':
            return {};
          default:
            return undefined;
        }
      };
    },
  }) as unknown as WebGL2RenderingContext;
  return { gl, calls };
}

function makeCanvas(gl: WebGL2RenderingContext) {
  return {
    width: 0,
    height: 0,
    getContext: () => gl,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as HTMLCanvasElement;
}

describe('BlackHoleRenderer lifecycle', () => {
  let rafQueue: FrameRequestCallback[] = [];
  let now = 1000;
  const flushRAF = () => {
    const q = rafQueue;
    rafQueue = [];
    now += 16.7;
    for (const cb of q) cb(now);
  };

  beforeEach(() => {
    rafQueue = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      rafQueue.splice(id - 1, 1);
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('in reduced-motion mode redraws after a resize even though start() was called', () => {
    const { gl, calls } = makeGL();
    const r = new BlackHoleRenderer(makeCanvas(gl), { reducedMotion: true });
    r.resize(800, 600, 1);
    const afterInit = calls.drawArrays ?? 0;
    expect(afterInit).toBeGreaterThan(0);

    r.start();
    flushRAF();
    const afterTick = calls.drawArrays;
    expect(afterTick).toBeGreaterThan(afterInit);
    expect(rafQueue).toHaveLength(0); // static scene: nothing scheduled

    r.resize(1000, 700, 1); // resizing clears the drawing buffer, so it must repaint
    expect(calls.drawArrays).toBeGreaterThan(afterTick);
    r.dispose();
  });

  it('in reduced-motion mode repaints on pointer movement', () => {
    const { gl, calls } = makeGL();
    const r = new BlackHoleRenderer(makeCanvas(gl), { reducedMotion: true });
    r.resize(800, 600, 1);
    r.start();
    flushRAF();
    const before = calls.drawArrays;
    r.setPointer(0.5, -0.2);
    expect(calls.drawArrays).toBeGreaterThan(before);
    r.dispose();
  });

  it('in motion mode keeps one frame pending and stops drawing after dispose()', () => {
    const { gl, calls } = makeGL();
    const r = new BlackHoleRenderer(makeCanvas(gl), { reducedMotion: false });
    r.resize(800, 600, 1);
    r.start();
    expect(rafQueue).toHaveLength(1);
    flushRAF();
    expect(rafQueue).toHaveLength(1); // rescheduled
    const drawsBeforeDispose = calls.drawArrays;
    r.dispose();
    flushRAF();
    expect(calls.drawArrays).toBe(drawsBeforeDispose);
    expect(rafQueue).toHaveLength(0);
  });

  it('releases every framebuffer and texture it created', () => {
    const { gl, calls } = makeGL();
    const r = new BlackHoleRenderer(makeCanvas(gl), { reducedMotion: false });
    r.resize(800, 600, 1);
    r.resize(400, 300, 1); // reallocation path
    r.dispose();
    expect(calls.deleteFramebuffer).toBe(calls.createFramebuffer);
    expect(calls.deleteTexture).toBe(calls.createTexture);
    expect(calls.deleteProgram).toBe(calls.createProgram);
  });
});
