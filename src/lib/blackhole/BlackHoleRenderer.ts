import { AdaptiveResolution } from './adaptiveResolution';
import { SHADER_STEP } from './geodesic';
import {
  BLOOM_DOWN_FRAG,
  BLOOM_PREFILTER_FRAG,
  BLOOM_UP_FRAG,
  COMPOSITE_FRAG,
  FULLSCREEN_VERT,
  SCENE_FRAG,
} from './shaders';

/**
 * WebGL2 renderer for the Anthropic black hole. Owns the GL context, render
 * targets, the frame loop and dynamic resolution. The React wrapper only feeds
 * it size, pointer position and visibility.
 */

export interface BlackHoleRendererOptions {
  /** Freeze the camera and disk when the user prefers reduced motion. */
  reducedMotion?: boolean;
  /** Upper bound on device pixel ratio used for the internal targets. */
  maxDpr?: number;
  /** Upper bound on the internal render width in device pixels. */
  maxInternalWidth?: number;
}

interface Program {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Target {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  width: number;
  height: number;
}

const BLOOM_LEVELS = 4;
const CAMERA_DISTANCE = 13.0;
const CAMERA_ELEVATION = 0.17; // radians above the disk plane
const TAN_HALF_FOV = 0.5;

export class BlackHoleRenderer {
  static isSupported(): boolean {
    if (typeof document === 'undefined') return false;
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return false;
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    } catch {
      return false;
    }
  }

  readonly canvas: HTMLCanvasElement;
  private readonly opts: Required<BlackHoleRendererOptions>;
  private gl: WebGL2RenderingContext;
  private hdr = false;
  private programs!: {
    scene: Program;
    prefilter: Program;
    down: Program;
    up: Program;
    composite: Program;
  };
  private sceneTarget: Target | null = null;
  private bloomTargets: Target[] = [];
  // GPU time has a 10 ms budget (headroom under a 16.7 ms frame); the RAF-cadence
  // fallback keeps the frame budget itself.
  private readonly resolution = new AdaptiveResolution({ min: 0.4, max: 1, window: 15, step: 0.1 });
  private timerExt: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null = null;
  private pendingQueries: WebGLQuery[] = [];
  private lastGpuMs = 0;
  private fps = 0;
  private fpsFrames = 0;
  private fpsWindowStart = 0;
  private compileMs = 0;
  private firstFrameMs = 0;
  private framesRendered = 0;

  private cssWidth = 1;
  private cssHeight = 1;
  private dpr = 1;
  private pointer = { x: 0, y: 0 };
  private pointerSmooth = { x: 0, y: 0 };
  private time = 0;
  private lastFrame = 0;
  private raf = 0;
  private running = false;
  private disposed = false;
  private contextLost = false;
  /** Development bisecting switch for the scene shader; see uDebug in shaders.ts. */
  debug = 0;

  private readonly onContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.stopLoop();
  };
  private readonly onContextRestored = () => {
    this.contextLost = false;
    this.initGL();
    this.allocateTargets(true);
    if (this.running) this.startLoop();
  };

  constructor(canvas: HTMLCanvasElement, opts: BlackHoleRendererOptions = {}) {
    this.canvas = canvas;
    this.opts = {
      reducedMotion: opts.reducedMotion ?? false,
      maxDpr: opts.maxDpr ?? 2,
      maxInternalWidth: opts.maxInternalWidth ?? 1920,
    };
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is not available');
    if (gl.isContextLost()) {
      // A previous renderer on this canvas (e.g. a React dev remount) left the context lost.
      gl.getExtension('WEBGL_lose_context')?.restoreContext();
      if (gl.isContextLost()) throw new Error('WebGL2 context is lost and could not be restored');
    }
    this.gl = gl;
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    this.initGL();
    if (this.opts.reducedMotion) this.time = 11.0; // a pleasant static frame
  }

  /** Current dynamic-resolution scale (0..1) and internal target size. */
  get stats() {
    return {
      scale: this.resolution.scale,
      hdr: this.hdr,
      internalWidth: this.sceneTarget?.width ?? 0,
      internalHeight: this.sceneTarget?.height ?? 0,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      fps: Math.round(this.fps),
      gpuMs: +this.lastGpuMs.toFixed(2),
      gpuTimed: !!this.timerExt,
      compileMs: Math.round(this.compileMs),
      firstFrameMs: Math.round(this.firstFrameMs),
      framesRendered: this.framesRendered,
    };
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.cssWidth = Math.max(1, Math.floor(cssWidth));
    this.cssHeight = Math.max(1, Math.floor(cssHeight));
    this.dpr = Math.min(this.opts.maxDpr, Math.max(1, dpr || 1));
    const w = Math.round(this.cssWidth * this.dpr);
    const h = Math.round(this.cssHeight * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.allocateTargets(false);
    // Repaint unless a frame is already scheduled: resizing clears the drawing buffer.
    if (!this.raf && !this.contextLost && !this.disposed) this.renderFrame();
  }

  /** Pointer position in [-1, 1] from the centre of the canvas. */
  setPointer(x: number, y: number): void {
    this.pointer.x = Math.max(-1, Math.min(1, x));
    this.pointer.y = Math.max(-1, Math.min(1, y));
    if (this.opts.reducedMotion && !this.raf && !this.contextLost && !this.disposed) this.renderFrame();
  }

  start(): void {
    if (this.disposed) return;
    this.running = true;
    if (!this.contextLost) this.startLoop();
  }

  stop(): void {
    this.running = false;
    this.stopLoop();
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    const gl = this.gl;
    this.releaseTargets();
    for (const q of this.pendingQueries) gl.deleteQuery(q);
    this.pendingQueries = [];
    for (const p of Object.values(this.programs ?? {})) gl.deleteProgram(p.program);
    // Deliberately no loseContext(): React may remount on the same canvas, and the
    // browser reclaims the context once the canvas element is garbage collected.
  }

  // ---------------------------------------------------------------- internals

  private startLoop(): void {
    if (this.raf) return;
    this.lastFrame = 0;
    const tick = (now: number) => {
      this.raf = 0;
      if (!this.running || this.contextLost || this.disposed) return;
      const dt = this.lastFrame ? now - this.lastFrame : 1000 / 60;
      this.lastFrame = now;
      this.fpsFrames++;
      if (!this.fpsWindowStart) this.fpsWindowStart = now;
      else if (now - this.fpsWindowStart >= 1000) {
        this.fps = (this.fpsFrames * 1000) / (now - this.fpsWindowStart);
        this.fpsFrames = 0;
        this.fpsWindowStart = now;
      }
      if (!this.opts.reducedMotion) {
        this.time += Math.min(dt, 100) / 1000;
        const before = this.resolution.scale;
        if (this.timerExt) {
          this.pollGpuTimers();
        } else {
          this.resolution.record(dt);
        }
        if (this.resolution.scale !== before) this.allocateTargets(false);
      }
      this.renderFrame();
      if (this.opts.reducedMotion) return; // a static scene only redraws on resize/pointer
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private initGL(): void {
    const gl = this.gl;
    const t0 = performance.now();
    this.timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    this.pendingQueries = [];
    this.hdr = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    const vert = compileShader(gl, gl.VERTEX_SHADER, FULLSCREEN_VERT);
    const make = (frag: string, uniforms: string[]): Program => {
      const program = linkProgram(gl, vert, compileShader(gl, gl.FRAGMENT_SHADER, frag));
      const map: Record<string, WebGLUniformLocation | null> = {};
      for (const u of uniforms) map[u] = gl.getUniformLocation(program, u);
      return { program, uniforms: map };
    };
    this.programs = {
      scene: make(SCENE_FRAG, ['uResolution', 'uTime', 'uCamPos', 'uCamBasis', 'uTanHalfFov', 'uMaxSteps', 'uDiskGain', 'uDebug']),
      prefilter: make(BLOOM_PREFILTER_FRAG, ['uTex', 'uTexel', 'uThreshold', 'uKnee']),
      down: make(BLOOM_DOWN_FRAG, ['uTex', 'uTexel']),
      up: make(BLOOM_UP_FRAG, ['uTex', 'uTexel']),
      composite: make(COMPOSITE_FRAG, ['uScene', 'uBloom', 'uBloomStrength', 'uExposure', 'uAberration', 'uTime']),
    };
    gl.deleteShader(vert);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    this.compileMs = performance.now() - t0;
  }

  private internalSize(): [number, number] {
    const scale = this.resolution.scale;
    let w = Math.round(this.canvas.width * scale);
    let h = Math.round(this.canvas.height * scale);
    if (w > this.opts.maxInternalWidth) {
      h = Math.round((h * this.opts.maxInternalWidth) / w);
      w = this.opts.maxInternalWidth;
    }
    return [Math.max(2, w), Math.max(2, h)];
  }

  private allocateTargets(force: boolean): void {
    if (this.contextLost) return;
    const [w, h] = this.internalSize();
    if (!force && this.sceneTarget && this.sceneTarget.width === w && this.sceneTarget.height === h) return;
    this.releaseTargets();
    this.sceneTarget = this.createTarget(w, h);
    this.bloomTargets = [];
    let bw = w, bh = h;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bw = Math.max(2, Math.floor(bw / 2));
      bh = Math.max(2, Math.floor(bh / 2));
      this.bloomTargets.push(this.createTarget(bw, bh));
    }
  }

  private releaseTargets(): void {
    const gl = this.gl;
    const free = (t: Target | null) => {
      if (!t) return;
      gl.deleteFramebuffer(t.fbo);
      gl.deleteTexture(t.tex);
    };
    free(this.sceneTarget);
    this.sceneTarget = null;
    this.bloomTargets.forEach(free);
    this.bloomTargets = [];
  }

  private createTarget(width: number, height: number): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (this.hdr) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      if (this.hdr) {
        // Driver advertised float colour buffers but refused one; fall back to 8-bit targets.
        this.hdr = false;
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(tex);
        return this.createTarget(width, height);
      }
      throw new Error(`Framebuffer incomplete: 0x${status.toString(16)}`);
    }
    return { fbo, tex, width, height };
  }

  private camera(): { pos: [number, number, number]; basis: Float32Array } {
    // A static (reduced-motion) scene redraws once per pointer event, so it snaps.
    const k = this.opts.reducedMotion ? 1 : 0.06;
    this.pointerSmooth.x += (this.pointer.x - this.pointerSmooth.x) * k;
    this.pointerSmooth.y += (this.pointer.y - this.pointerSmooth.y) * k;
    const t = this.time;
    const az = 0.022 * t + this.pointerSmooth.x * 0.22;
    const el = CAMERA_ELEVATION + 0.012 * Math.sin(t * 0.11) - this.pointerSmooth.y * 0.10;
    const pos: [number, number, number] = [
      CAMERA_DISTANCE * Math.cos(el) * Math.cos(az),
      CAMERA_DISTANCE * Math.sin(el),
      CAMERA_DISTANCE * Math.cos(el) * Math.sin(az),
    ];
    // Look at the hole; keep the disk normal (+y) as world up.
    const f = normalize([-pos[0], -pos[1], -pos[2]]);
    const r = normalize(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    // column-major mat3: right, up, forward
    const basis = new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], f[0], f[1], f[2]]);
    return { pos, basis };
  }

  /**
   * Development aid: render one frame pass by pass with a GPU sync after each
   * and return the wall-clock cost of every pass in milliseconds.
   */
  profile(): { sceneMs: number; bloomMs: number; compositeMs: number; cpuMs: number } {
    const gl = this.gl;
    if (!this.sceneTarget) this.allocateTargets(true);
    const cam = this.camera();
    const c0 = performance.now();
    this.renderFrame();
    const cpuMs = performance.now() - c0;
    const timed = (fn: () => void) => {
      gl.finish();
      const t0 = performance.now();
      fn();
      gl.finish();
      return performance.now() - t0;
    };
    const sceneMs = timed(() => this.passScene(cam));
    const bloomMs = timed(() => this.passBloom());
    const compositeMs = timed(() => this.passComposite());
    return { sceneMs, bloomMs, compositeMs, cpuMs };
  }

  private renderFrame(): void {
    if (this.contextLost || this.disposed) return;
    if (!this.sceneTarget) this.allocateTargets(true);
    const cam = this.camera();
    const gl = this.gl;
    // Time the whole frame on the GPU when the extension exists; results are read
    // back a few frames later in pollGpuTimers().
    let query: WebGLQuery | null = null;
    if (this.timerExt && this.running && this.pendingQueries.length < 8) {
      query = gl.createQuery();
      if (query) gl.beginQuery(this.timerExt.TIME_ELAPSED_EXT, query);
    }
    this.passScene(cam);
    this.passBloom();
    this.passComposite();
    if (query) {
      gl.endQuery(this.timerExt!.TIME_ELAPSED_EXT);
      this.pendingQueries.push(query);
    }

    if (this.framesRendered === 0 && import.meta.env.DEV) {
      // Dev-only one-time sync so the first-frame cost (driver-side pipeline compilation)
      // shows up in stats; in production the first frame stays asynchronous.
      const t0 = performance.now();
      gl.finish();
      this.firstFrameMs = performance.now() - t0;
    }
    this.framesRendered++;
  }

  private pollGpuTimers(): void {
    const gl = this.gl;
    const ext = this.timerExt!;
    while (this.pendingQueries.length) {
      const q = this.pendingQueries[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      this.pendingQueries.shift();
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) as boolean;
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
      gl.deleteQuery(q);
      if (disjoint) continue;
      const ms = ns / 1e6;
      this.lastGpuMs = ms;
      // 10 ms of GPU time per frame keeps a 60 Hz frame comfortably.
      this.resolution.record((ms * this.resolution.targetFrameMs) / 10);
    }
  }

  private passScene({ pos, basis }: { pos: [number, number, number]; basis: Float32Array }): void {
    const gl = this.gl;
    const scene = this.sceneTarget!;
    const P = this.programs;
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
    gl.viewport(0, 0, scene.width, scene.height);
    gl.useProgram(P.scene.program);
    gl.uniform2f(P.scene.uniforms.uResolution, scene.width, scene.height);
    gl.uniform1f(P.scene.uniforms.uTime, this.time);
    gl.uniform3f(P.scene.uniforms.uCamPos, pos[0], pos[1], pos[2]);
    gl.uniformMatrix3fv(P.scene.uniforms.uCamBasis, false, basis);
    gl.uniform1f(P.scene.uniforms.uTanHalfFov, TAN_HALF_FOV);
    gl.uniform1i(P.scene.uniforms.uMaxSteps, SHADER_STEP.maxSteps);
    gl.uniform1i(P.scene.uniforms.uDebug, this.debug);
    gl.uniform1f(P.scene.uniforms.uDiskGain, this.hdr ? 0.9 : 0.7);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private passBloom(): void {
    const gl = this.gl;
    const scene = this.sceneTarget!;
    const P = this.programs;
    gl.activeTexture(gl.TEXTURE0);
    const b = this.bloomTargets;
    gl.bindFramebuffer(gl.FRAMEBUFFER, b[0].fbo);
    gl.viewport(0, 0, b[0].width, b[0].height);
    gl.useProgram(P.prefilter.program);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.uniform1i(P.prefilter.uniforms.uTex, 0);
    gl.uniform2f(P.prefilter.uniforms.uTexel, 1 / scene.width, 1 / scene.height);
    gl.uniform1f(P.prefilter.uniforms.uThreshold, this.hdr ? 1.0 : 0.55);
    gl.uniform1f(P.prefilter.uniforms.uKnee, this.hdr ? 0.6 : 0.3);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(P.down.program);
    gl.uniform1i(P.down.uniforms.uTex, 0);
    for (let i = 1; i < b.length; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, b[i].fbo);
      gl.viewport(0, 0, b[i].width, b[i].height);
      gl.bindTexture(gl.TEXTURE_2D, b[i - 1].tex);
      gl.uniform2f(P.down.uniforms.uTexel, 1 / b[i - 1].width, 1 / b[i - 1].height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.up.program);
    gl.uniform1i(P.up.uniforms.uTex, 0);
    for (let i = b.length - 1; i > 0; i--) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, b[i - 1].fbo);
      gl.viewport(0, 0, b[i - 1].width, b[i - 1].height);
      gl.bindTexture(gl.TEXTURE_2D, b[i].tex);
      gl.uniform2f(P.up.uniforms.uTexel, 1 / b[i].width, 1 / b[i].height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);
  }

  private passComposite(): void {
    const gl = this.gl;
    const scene = this.sceneTarget!;
    const b = this.bloomTargets;
    const P = this.programs;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(P.composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b[0].tex);
    gl.uniform1i(P.composite.uniforms.uScene, 0);
    gl.uniform1i(P.composite.uniforms.uBloom, 1);
    gl.uniform1f(P.composite.uniforms.uBloomStrength, 0.7);
    gl.uniform1f(P.composite.uniforms.uExposure, 1.0);
    gl.uniform1f(P.composite.uniforms.uAberration, 0.012);
    gl.uniform1f(P.composite.uniforms.uTime, this.time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  }
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram {
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${log}`);
  }
  return program;
}

type V3 = [number, number, number];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
