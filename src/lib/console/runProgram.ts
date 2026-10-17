import { RecordingPainter, type TextRecord } from './RecordingPainter';
import { LOGICAL_HEIGHT } from './layout';
import type { GameFactory, GameHost, Input } from './types';

export interface RunOptions {
  seconds: number;
  fps?: number;
  /** Logical width; height is always LOGICAL_HEIGHT. */
  width?: number;
  clicks?: ReadonlyArray<{ at: number; x: number; y: number }>;
  keys?: ReadonlyArray<{ at: number; key: string }>;
  /** Pointer position over time when it is not clicking. */
  pointer?: (t: number) => { x: number; y: number };
  host?: Partial<GameHost>;
}

export interface RunResult {
  frames: number;
  errors: string[];
  /** Every distinct string drawn with text()/textBlock() during the run. */
  textsSeen: Set<string>;
  /** Text drawn in the final frame. */
  lastTexts: TextRecord[];
  /** URLs the program asked the host to open. */
  opened: string[];
  painter: RecordingPainter;
}

/**
 * Drives a game program headlessly with simulated time and input. Exceptions
 * from update()/draw() are collected rather than thrown so a test can report
 * the first failing frame.
 */
export function runProgram(factory: GameFactory, opts: RunOptions): RunResult {
  const fps = opts.fps ?? 60;
  const dt = 1 / fps;
  const frames = Math.round(opts.seconds * fps);
  const painter = new RecordingPainter(opts.width ?? 960, LOGICAL_HEIGHT);
  const opened: string[] = [];
  const host: GameHost = { openUrl: url => opened.push(url), ...opts.host };
  const program = factory(host);
  const errors: string[] = [];
  const textsSeen = new Set<string>();
  let lastTexts: TextRecord[] = [];
  let pointer = { x: -1, y: -1 };
  // Assign events to frames by index so float rounding can never double-count one.
  const frameOf = (at: number) => Math.floor(at * fps + 1e-9);
  const clicksByFrame = new Map<number, { x: number; y: number }[]>();
  for (const c of opts.clicks ?? []) clicksByFrame.set(frameOf(c.at), [...(clicksByFrame.get(frameOf(c.at)) ?? []), c]);
  const keysByFrame = new Map<number, string[]>();
  for (const k of opts.keys ?? []) keysByFrame.set(frameOf(k.at), [...(keysByFrame.get(frameOf(k.at)) ?? []), k.key]);

  for (let i = 0; i < frames; i++) {
    const t = i * dt;
    const clicks = clicksByFrame.get(i) ?? [];
    const keys = new Set(keysByFrame.get(i) ?? []);
    if (clicks.length) pointer = { x: clicks[0].x, y: clicks[0].y };
    else if (opts.pointer) pointer = opts.pointer(t);
    const input: Input = {
      pointer: {
        x: pointer.x,
        y: pointer.y,
        down: clicks.length > 0,
        justPressed: clicks.length > 0,
        justReleased: false,
        inside: pointer.x >= 0 && pointer.y >= 0 && pointer.x <= painter.width && pointer.y <= painter.height,
      },
      keysJustPressed: keys,
      keysDown: keys,
    };
    try {
      program.update(dt, input, t);
      painter.beginFrame(i, t);
      program.draw(painter);
      for (const rec of painter.texts) textsSeen.add(rec.text);
      lastTexts = [...painter.texts];
    } catch (err) {
      errors.push(`frame ${i} (t=${t.toFixed(2)}s): ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    }
  }
  program.dispose?.();
  return { frames, errors, textsSeen, lastTexts, opened, painter };
}
