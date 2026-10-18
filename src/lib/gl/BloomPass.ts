import { Program, Target, bindTarget, createProgram, createTarget, deleteTarget, drawFullscreen } from './core';

const PREFILTER_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;       // 1 / source size
uniform float uThreshold;
uniform float uKnee;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec3 s = texture(uTex, vUv + vec2(-0.5, -0.5) * uTexel).rgb
         + texture(uTex, vUv + vec2( 0.5, -0.5) * uTexel).rgb
         + texture(uTex, vUv + vec2(-0.5,  0.5) * uTexel).rgb
         + texture(uTex, vUv + vec2( 0.5,  0.5) * uTexel).rgb;
  s *= 0.25;
  float br = max(s.r, max(s.g, s.b));
  float soft = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  fragColor = vec4(s * contrib, 1.0);
}
`;

const DOWN_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 4.0;
  c += texture(uTex, vUv + vec2(-1.0, -1.0) * uTexel).rgb;
  c += texture(uTex, vUv + vec2( 1.0, -1.0) * uTexel).rgb;
  c += texture(uTex, vUv + vec2(-1.0,  1.0) * uTexel).rgb;
  c += texture(uTex, vUv + vec2( 1.0,  1.0) * uTexel).rgb;
  fragColor = vec4(c / 8.0, 1.0);
}
`;

const UP_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec3 c = vec3(0.0);
  c += texture(uTex, vUv + vec2(-1.0,  0.0) * uTexel).rgb * 2.0;
  c += texture(uTex, vUv + vec2( 1.0,  0.0) * uTexel).rgb * 2.0;
  c += texture(uTex, vUv + vec2( 0.0, -1.0) * uTexel).rgb * 2.0;
  c += texture(uTex, vUv + vec2( 0.0,  1.0) * uTexel).rgb * 2.0;
  c += texture(uTex, vUv + vec2(-0.5, -0.5) * uTexel).rgb;
  c += texture(uTex, vUv + vec2( 0.5, -0.5) * uTexel).rgb;
  c += texture(uTex, vUv + vec2(-0.5,  0.5) * uTexel).rgb;
  c += texture(uTex, vUv + vec2( 0.5,  0.5) * uTexel).rgb;
  fragColor = vec4(c / 12.0, 1.0);
}
`;

/**
 * Dual-filter bloom: soft-threshold prefilter into a half-resolution chain,
 * downsample `levels` times, then additively upsample back. `texture` holds the
 * result at half the source resolution.
 */
export class BloomPass {
  private readonly prefilter: Program;
  private readonly down: Program;
  private readonly up: Program;
  private targets: Target[] = [];
  private sourceWidth = 0;
  private sourceHeight = 0;
  private hdr = false;

  constructor(private readonly gl: WebGL2RenderingContext, private readonly levels = 4) {
    this.prefilter = createProgram(gl, PREFILTER_FRAG, ['uTex', 'uTexel', 'uThreshold', 'uKnee']);
    this.down = createProgram(gl, DOWN_FRAG, ['uTex', 'uTexel']);
    this.up = createProgram(gl, UP_FRAG, ['uTex', 'uTexel']);
  }

  get texture(): WebGLTexture | null {
    return this.targets[0]?.tex ?? null;
  }

  /** (Re)allocates the mip chain for a source of this size. Returns false if the format is unsupported. */
  resize(sourceWidth: number, sourceHeight: number, hdr: boolean): boolean {
    if (this.targets.length && sourceWidth === this.sourceWidth && sourceHeight === this.sourceHeight && hdr === this.hdr) return true;
    this.release();
    this.sourceWidth = sourceWidth;
    this.sourceHeight = sourceHeight;
    this.hdr = hdr;
    let w = sourceWidth, h = sourceHeight;
    for (let i = 0; i < this.levels; i++) {
      w = Math.max(2, Math.floor(w / 2));
      h = Math.max(2, Math.floor(h / 2));
      const t = createTarget(this.gl, w, h, { hdr });
      if (!t) {
        this.release();
        return false;
      }
      this.targets.push(t);
    }
    return true;
  }

  run(sourceTex: WebGLTexture, opts: { threshold: number; knee: number }): void {
    const gl = this.gl;
    const b = this.targets;
    if (!b.length) return;
    gl.activeTexture(gl.TEXTURE0);

    bindTarget(gl, b[0]);
    gl.useProgram(this.prefilter.program);
    gl.bindTexture(gl.TEXTURE_2D, sourceTex);
    gl.uniform1i(this.prefilter.uniforms.uTex, 0);
    gl.uniform2f(this.prefilter.uniforms.uTexel, 1 / this.sourceWidth, 1 / this.sourceHeight);
    gl.uniform1f(this.prefilter.uniforms.uThreshold, opts.threshold);
    gl.uniform1f(this.prefilter.uniforms.uKnee, opts.knee);
    drawFullscreen(gl);

    gl.useProgram(this.down.program);
    gl.uniform1i(this.down.uniforms.uTex, 0);
    for (let i = 1; i < b.length; i++) {
      bindTarget(gl, b[i]);
      gl.bindTexture(gl.TEXTURE_2D, b[i - 1].tex);
      gl.uniform2f(this.down.uniforms.uTexel, 1 / b[i - 1].width, 1 / b[i - 1].height);
      drawFullscreen(gl);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.up.program);
    gl.uniform1i(this.up.uniforms.uTex, 0);
    for (let i = b.length - 1; i > 0; i--) {
      bindTarget(gl, b[i - 1]);
      gl.bindTexture(gl.TEXTURE_2D, b[i].tex);
      gl.uniform2f(this.up.uniforms.uTexel, 1 / b[i].width, 1 / b[i].height);
      drawFullscreen(gl);
    }
    gl.disable(gl.BLEND);
  }

  release(): void {
    for (const t of this.targets) deleteTarget(this.gl, t);
    this.targets = [];
  }

  dispose(): void {
    this.release();
    const gl = this.gl;
    gl.deleteProgram(this.prefilter.program);
    gl.deleteProgram(this.down.program);
    gl.deleteProgram(this.up.program);
  }
}
