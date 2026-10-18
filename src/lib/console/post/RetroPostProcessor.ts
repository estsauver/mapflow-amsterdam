import { BloomPass } from '@/lib/gl/BloomPass';
import { Program, Target, bindTarget, createProgram, createTarget, deleteTarget, drawFullscreen, supportsHdrTargets } from '@/lib/gl/core';
import type { Frame } from '../layout';
import type { PostInput, PostProcessor } from './PostProcessor';
import { COMPOSE_FRAG, COMPOSITE_FRAG, FLARE_FRAG, LIGHTING_FRAG, SHAFTS_FRAG, UPSCALE_FRAG } from './shaders';

export type { PostInput } from './PostProcessor';

/**
 * GPU post pipeline for the console. Takes the three layer canvases, composes
 * them at virtual resolution (parallax, palette, dither), upscales to device
 * resolution with CRT treatment, blooms, relights, and composites onto a
 * perspective-tilted plane.
 */
export class RetroPostProcessor implements PostProcessor {
  readonly kind = 'webgl2' as const;
  readonly gl: WebGL2RenderingContext;
  private programs!: { compose: Program; upscale: Program; lighting: Program; shafts: Program; flare: Program; composite: Program };
  private bloom!: BloomPass;
  private hdr: boolean;
  private layerTex: WebGLTexture[] = [];
  private compose: Target | null = null;
  private scene: Target | null = null;
  private lit: Target | null = null;
  private shaft: Target | null = null;
  private flareA: Target | null = null;
  private flareB: Target | null = null;
  private deviceWidth = 0;
  private deviceHeight = 0;
  private timerExt: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private pendingQueries: WebGLQuery[] = [];
  private lastGpuMs = 0;
  private disposed = false;
  /** True between webglcontextlost and webglcontextrestored; render() and upload() no-op meanwhile. */
  lost = false;
  onContextLost?: () => void;
  onContextRestored?: () => void;

  private readonly handleContextLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.pendingQueries = [];
    this.onContextLost?.();
  };
  private readonly handleContextRestored = () => {
    // Every GL object died with the context: rebuild programs and force reallocation.
    this.timerExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    this.hdr = supportsHdrTargets(this.gl);
    this.initPrograms();
    this.layerTex = [];
    this.compose = this.scene = this.lit = this.shaft = this.flareA = this.flareB = null;
    this.deviceWidth = this.deviceHeight = 0;
    this.lost = false;
    this.onContextRestored?.();
  };

  constructor(readonly canvas: HTMLCanvasElement) {
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
      gl.getExtension('WEBGL_lose_context')?.restoreContext();
      if (gl.isContextLost()) throw new Error('WebGL2 context is lost and could not be restored');
    }
    this.gl = gl;
    this.hdr = supportsHdrTargets(gl);
    this.timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    this.initPrograms();
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private initPrograms(): void {
    const gl = this.gl;
    this.programs = {
      compose: createProgram(gl, COMPOSE_FRAG, ['uLayer0', 'uLayer1', 'uLayer2', 'uTexScale', 'uVirtual', 'uParallax', 'uPointer', 'uLevels', 'uDither', 'uDof', 'uFog']),
      upscale: createProgram(gl, UPSCALE_FRAG, ['uScene', 'uSceneScale', 'uVirtual', 'uOutput', 'uSmooth', 'uBarrel', 'uVignette', 'uSaturation', 'uContrast']),
      lighting: createProgram(gl, LIGHTING_FRAG, ['uScene', 'uTexel', 'uLight', 'uAspect', 'uStrength', 'uShadows']),
      shafts: createProgram(gl, SHAFTS_FRAG, ['uScene', 'uLight']),
      flare: createProgram(gl, FLARE_FRAG, ['uTex', 'uTexel', 'uDir', 'uTint']),
      composite: createProgram(gl, COMPOSITE_FRAG, ['uScene', 'uBloom', 'uBloomStrength', 'uAberration', 'uGrain', 'uTime', 'uOutput', 'uScanlines', 'uMask', 'uVirtual', 'uShafts', 'uShaftStrength', 'uFlare', 'uFlareStrength', 'uDust', 'uGrade', 'uLight', 'uRx', 'uRy', 'uAspect', 'uDist', 'uShrink', 'uBackground']),
    };
    this.bloom = new BloomPass(gl, 4);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  get stats() {
    return { hdr: this.hdr, gpuMs: +this.lastGpuMs.toFixed(2), gpuTimed: !!this.timerExt, deviceWidth: this.deviceWidth, deviceHeight: this.deviceHeight };
  }

  /** (Re)allocates textures and targets when the device size changes. */
  resize(frame: Frame): void {
    if (this.disposed || this.lost) return;
    if (frame.deviceWidth === this.deviceWidth && frame.deviceHeight === this.deviceHeight && this.layerTex.length) return;
    const gl = this.gl;
    this.release();
    this.deviceWidth = frame.deviceWidth;
    this.deviceHeight = frame.deviceHeight;
    for (let i = 0; i < 3; i++) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, frame.deviceWidth, frame.deviceHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.layerTex.push(tex);
    }
    this.compose = createTarget(gl, frame.deviceWidth, frame.deviceHeight, { hdr: false, filter: 'linear' });
    let scene = createTarget(gl, frame.deviceWidth, frame.deviceHeight, { hdr: this.hdr, encoding: 'srgb' });
    let lit = scene && createTarget(gl, frame.deviceWidth, frame.deviceHeight, { hdr: this.hdr, encoding: 'srgb' });
    if ((!scene || !lit) && this.hdr) {
      // Driver advertised float colour buffers but refused one; use sRGB-encoded 8-bit targets instead.
      deleteTarget(gl, scene);
      deleteTarget(gl, lit);
      this.hdr = false;
      scene = createTarget(gl, frame.deviceWidth, frame.deviceHeight, { hdr: false, encoding: 'srgb' });
      lit = createTarget(gl, frame.deviceWidth, frame.deviceHeight, { hdr: false, encoding: 'srgb' });
    }
    if (!this.compose || !scene || !lit) throw new Error('Could not allocate the console framebuffers');
    this.scene = scene;
    this.lit = lit;
    const hw = Math.max(2, Math.floor(frame.deviceWidth / 2)), hh = Math.max(2, Math.floor(frame.deviceHeight / 2));
    const qw = Math.max(2, Math.floor(frame.deviceWidth / 4)), qh = Math.max(2, Math.floor(frame.deviceHeight / 4));
    this.shaft = createTarget(gl, hw, hh, { hdr: this.hdr, encoding: 'srgb' });
    this.flareA = createTarget(gl, qw, qh, { hdr: this.hdr, encoding: 'srgb' });
    this.flareB = createTarget(gl, qw, qh, { hdr: this.hdr, encoding: 'srgb' });
    if (!this.shaft || !this.flareA || !this.flareB) throw new Error('Could not allocate the effect framebuffers');
    if (!this.bloom.resize(frame.deviceWidth, frame.deviceHeight, this.hdr)) throw new Error('Could not allocate the bloom framebuffers');
  }

  /** Copies the drawn vw×vh region of each layer canvas into its texture. */
  upload(layers: readonly HTMLCanvasElement[], vw: number, vh: number): void {
    if (this.lost || !this.layerTex.length) return;
    const gl = this.gl;
    for (let i = 0; i < 3; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this.layerTex[i]);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, vw, vh, gl.RGBA, gl.UNSIGNED_BYTE, layers[i]);
    }
  }

  render(frame: Frame, input: PostInput): void {
    if (this.disposed || this.lost || !this.compose || !this.scene || !this.lit) return;
    const gl = this.gl;
    const f = input.fidelity;
    const P = this.programs;

    let query: WebGLQuery | null = null;
    if (this.timerExt && this.pendingQueries.length < 8) {
      query = gl.createQuery();
      if (query) gl.beginQuery(this.timerExt.TIME_ELAPSED_EXT, query);
    }

    // 1. Compose layers at virtual resolution with parallax, palette and dither.
    bindTarget(gl, this.compose);
    gl.viewport(0, 0, frame.vw, frame.vh);
    gl.useProgram(P.compose.program);
    for (let i = 0; i < 3; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, this.layerTex[i]);
    }
    gl.uniform1i(P.compose.uniforms.uLayer0, 0);
    gl.uniform1i(P.compose.uniforms.uLayer1, 1);
    gl.uniform1i(P.compose.uniforms.uLayer2, 2);
    gl.uniform2f(P.compose.uniforms.uTexScale, frame.vw / this.deviceWidth, frame.vh / this.deviceHeight);
    gl.uniform2f(P.compose.uniforms.uVirtual, frame.vw, frame.vh);
    gl.uniform1f(P.compose.uniforms.uParallax, f.parallax);
    gl.uniform2f(P.compose.uniforms.uPointer, input.pointer.x, -input.pointer.y);
    gl.uniform1f(P.compose.uniforms.uLevels, f.posterizeLevels);
    gl.uniform1f(P.compose.uniforms.uDither, f.dither);
    gl.uniform1f(P.compose.uniforms.uDof, f.dof);
    gl.uniform1f(P.compose.uniforms.uFog, f.fog);
    drawFullscreen(gl);

    // 2. Upscale to device resolution with the CRT treatment; output linear light.
    bindTarget(gl, this.scene);
    gl.useProgram(P.upscale.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.compose.tex);
    gl.uniform1i(P.upscale.uniforms.uScene, 0);
    gl.uniform2f(P.upscale.uniforms.uSceneScale, frame.vw / this.deviceWidth, frame.vh / this.deviceHeight);
    gl.uniform2f(P.upscale.uniforms.uVirtual, frame.vw, frame.vh);
    gl.uniform2f(P.upscale.uniforms.uOutput, this.deviceWidth, this.deviceHeight);
    gl.uniform1f(P.upscale.uniforms.uSmooth, f.smooth);
    gl.uniform1f(P.upscale.uniforms.uBarrel, f.barrel);
    gl.uniform1f(P.upscale.uniforms.uVignette, f.vignette);
    gl.uniform1f(P.upscale.uniforms.uSaturation, f.saturation);
    gl.uniform1f(P.upscale.uniforms.uContrast, f.contrast);
    drawFullscreen(gl);

    // 3. Bloom from the linear scene.
    this.bloom.run(this.scene.tex, { threshold: 0.8, knee: 0.3 });

    // 4. Relief lighting and contact shadows (HD era onward).
    const light: [number, number] = [0.5 + 0.45 * input.pointer.x, 0.5 - 0.45 * input.pointer.y];
    let finalTex = this.scene.tex;
    if (f.lighting > 0.005 || f.shadows > 0.005) {
      bindTarget(gl, this.lit);
      gl.useProgram(P.lighting.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.scene.tex);
      gl.uniform1i(P.lighting.uniforms.uScene, 0);
      gl.uniform2f(P.lighting.uniforms.uTexel, 1 / this.deviceWidth, 1 / this.deviceHeight);
      gl.uniform2f(P.lighting.uniforms.uLight, light[0], light[1]);
      gl.uniform1f(P.lighting.uniforms.uAspect, frame.aspect);
      gl.uniform1f(P.lighting.uniforms.uStrength, f.lighting);
      gl.uniform1f(P.lighting.uniforms.uShadows, f.shadows);
      drawFullscreen(gl);
      finalTex = this.lit.tex;
    }

    // 5. Volumetric light shafts at half resolution (cinematic era). Sourced from
    //    the blurred bloom chain so rays are soft light, not smeared copies of text.
    if (f.shafts > 0.005 && this.shaft && this.bloom.texture) {
      bindTarget(gl, this.shaft);
      gl.useProgram(P.shafts.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloom.texture);
      gl.uniform1i(P.shafts.uniforms.uScene, 0);
      gl.uniform2f(P.shafts.uniforms.uLight, light[0], light[1]);
      drawFullscreen(gl);
    }

    // 6. Anamorphic flare: two wide horizontal blurs of the bloom at quarter resolution.
    if (f.flare > 0.005 && this.flareA && this.flareB && this.bloom.texture) {
      gl.useProgram(P.flare.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(P.flare.uniforms.uTex, 0);
      gl.uniform2f(P.flare.uniforms.uDir, 1, 0);
      bindTarget(gl, this.flareA);
      gl.bindTexture(gl.TEXTURE_2D, this.bloom.texture);
      gl.uniform2f(P.flare.uniforms.uTexel, 1 / this.flareA.width, 1 / this.flareA.height);
      gl.uniform3f(P.flare.uniforms.uTint, 1, 1, 1);
      drawFullscreen(gl);
      bindTarget(gl, this.flareB);
      gl.bindTexture(gl.TEXTURE_2D, this.flareA.tex);
      gl.uniform3f(P.flare.uniforms.uTint, 0.7, 0.85, 1.25);
      drawFullscreen(gl);
    }

    // 7. Composite onto the tilted plane.
    bindTarget(gl, null, this.canvas.width, this.canvas.height);
    gl.useProgram(P.composite.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, finalTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloom.texture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.shaft!.tex);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this.flareB!.tex);
    gl.uniform1i(P.composite.uniforms.uScene, 0);
    gl.uniform1i(P.composite.uniforms.uBloom, 1);
    gl.uniform1i(P.composite.uniforms.uShafts, 2);
    gl.uniform1i(P.composite.uniforms.uFlare, 3);
    gl.uniform1f(P.composite.uniforms.uShaftStrength, f.shafts);
    gl.uniform1f(P.composite.uniforms.uFlareStrength, f.flare);
    gl.uniform1f(P.composite.uniforms.uDust, f.dust);
    gl.uniform1f(P.composite.uniforms.uGrade, f.grade);
    gl.uniform2f(P.composite.uniforms.uLight, light[0], light[1]);
    gl.uniform1f(P.composite.uniforms.uBloomStrength, f.bloom * 0.9);
    gl.uniform1f(P.composite.uniforms.uAberration, f.aberration);
    gl.uniform1f(P.composite.uniforms.uGrain, f.grain);
    gl.uniform1f(P.composite.uniforms.uTime, input.time);
    gl.uniform2f(P.composite.uniforms.uOutput, this.canvas.width, this.canvas.height);
    gl.uniform1f(P.composite.uniforms.uScanlines, f.scanlines);
    gl.uniform1f(P.composite.uniforms.uMask, f.mask);
    gl.uniform2f(P.composite.uniforms.uVirtual, frame.vw, frame.vh);
    gl.uniform1f(P.composite.uniforms.uRx, input.tilt.rx);
    gl.uniform1f(P.composite.uniforms.uRy, input.tilt.ry);
    gl.uniform1f(P.composite.uniforms.uAspect, input.tilt.aspect);
    gl.uniform1f(P.composite.uniforms.uDist, input.tilt.dist);
    gl.uniform1f(P.composite.uniforms.uShrink, input.tilt.shrink);
    gl.uniform3f(P.composite.uniforms.uBackground, 0.012, 0.012, 0.02);
    drawFullscreen(gl);
    gl.activeTexture(gl.TEXTURE0);

    if (query) {
      gl.endQuery(this.timerExt!.TIME_ELAPSED_EXT);
      this.pendingQueries.push(query);
    }
    this.pollTimers();
  }

  private pollTimers(): void {
    const gl = this.gl;
    const ext = this.timerExt;
    if (!ext) return;
    while (this.pendingQueries.length) {
      const q = this.pendingQueries[0];
      if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) break;
      this.pendingQueries.shift();
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT) as boolean;
      const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
      gl.deleteQuery(q);
      if (!disjoint) this.lastGpuMs = ns / 1e6;
    }
  }

  private release(): void {
    const gl = this.gl;
    for (const t of this.layerTex) gl.deleteTexture(t);
    this.layerTex = [];
    deleteTarget(gl, this.compose);
    deleteTarget(gl, this.scene);
    deleteTarget(gl, this.lit);
    deleteTarget(gl, this.shaft);
    deleteTarget(gl, this.flareA);
    deleteTarget(gl, this.flareB);
    this.compose = this.scene = this.lit = this.shaft = this.flareA = this.flareB = null;
    this.bloom.release();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    const gl = this.gl;
    this.release();
    for (const q of this.pendingQueries) gl.deleteQuery(q);
    this.pendingQueries = [];
    this.bloom.dispose();
    for (const p of Object.values(this.programs)) gl.deleteProgram(p.program);
    // No loseContext(): React may remount on the same canvas; the browser reclaims it with the element.
  }
}
