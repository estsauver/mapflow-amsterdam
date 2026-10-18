/**
 * GLSL ES 3.00 for the console post pipeline:
 *   compose  – three layer textures → one virtual-resolution frame (parallax, palette quantisation, dither)
 *   upscale  – virtual → device resolution (nearest ↔ bicubic), CRT barrel/scanlines/mask, vignette, grading; outputs linear light
 *   lighting – relief lighting from the luminance gradient with a pointer-driven light
 *   composite – perspective tilt, bloom, chromatic aberration, ACES, grain, dither
 */

const COMMON = `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
`;

export const COMPOSE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uLayer0;
uniform sampler2D uLayer1;
uniform sampler2D uLayer2;
uniform vec2 uTexScale;      // vw/texW, vh/texH
uniform vec2 uVirtual;       // vw, vh
uniform float uParallax;     // 0..1
uniform vec2 uPointer;       // -1..1
uniform float uLevels;       // colour levels per channel, 256 = off
uniform float uDither;       // 0..1
uniform float uDof;          // background blur, 0..1
uniform float uFog;          // background haze, 0..1
in vec2 vUv;
out vec4 fragColor;
${COMMON}
const vec2 POISSON[12] = vec2[12](
  vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457), vec2(-0.203, 0.621),
  vec2(0.962, -0.195), vec2(0.473, -0.480), vec2(0.519, 0.767), vec2(0.185, -0.893),
  vec2(0.507, 0.064), vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598));
vec4 layerAt(sampler2D t, vec2 uv) {
  // Clamp to texel centres: the layer texture is device-sized and only the
  // top-left vw×vh is drawn, so uv = 1.0 would land on the first undrawn texel.
  uv = clamp(uv, vec2(0.5) / uVirtual, 1.0 - vec2(0.5) / uVirtual);
  return texture(t, vec2(uv.x, 1.0 - uv.y) * uTexScale);
}
float bayer4(vec2 p) {
  ivec2 i = ivec2(mod(p, 4.0));
  int idx = i.x + i.y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[idx]) + 0.5) / 16.0;
}
// The background layer is the far plane: depth of field blurs it, haze lifts it.
vec4 backLayer(vec2 uv) {
  vec4 c = layerAt(uLayer0, uv);
  if (uDof > 0.01) {
    vec2 radius = (uDof * 6.0 * uVirtual.y / 540.0) / uVirtual;
    vec4 acc = c;
    for (int i = 0; i < 12; i++) acc += layerAt(uLayer0, uv + POISSON[i] * radius);
    c = acc / 13.0;
  }
  if (uFog > 0.001) {
    float l = luma(c.rgb);
    vec3 hazed = mix(c.rgb, vec3(l), 0.35) * 0.92 + vec3(0.42, 0.50, 0.62) * c.a * 0.22;
    c.rgb = mix(c.rgb, hazed, uFog);
  }
  return c;
}
void main() {
  // Parallax in logical units (10 px at full depth) converted to uv.
  vec2 shift = uPointer * uParallax * (10.0 * uVirtual.y / 540.0) / uVirtual;
  vec4 back = backLayer(vUv - shift * 0.6);
  vec4 mid = layerAt(uLayer1, vUv);
  vec4 front = layerAt(uLayer2, vUv + shift * 0.9);
  // Layers are premultiplied; composite over black.
  vec3 col = back.rgb;
  col = mid.rgb + col * (1.0 - mid.a);
  col = front.rgb + col * (1.0 - front.a);
  if (uLevels < 255.0) {
    float steps = uLevels - 1.0;
    float d = mix(0.5, bayer4(gl_FragCoord.xy), uDither);
    col = floor(col * steps + d) / steps;
  }
  fragColor = vec4(col, 1.0);
}
`;

export const UPSCALE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uSceneScale;    // vw/texW, vh/texH (scene lives in the top-left of its target)
uniform vec2 uVirtual;       // vw, vh
uniform vec2 uOutput;        // device pixels
uniform float uSmooth;       // 0 nearest .. 1 bicubic
uniform float uBarrel;
uniform float uVignette;
uniform float uSaturation;
uniform float uContrast;
in vec2 vUv;
out vec4 fragColor;
${COMMON}
vec3 fetchNearest(vec2 uv) {
  ivec2 p = ivec2(clamp(floor(uv * uVirtual), vec2(0.0), uVirtual - 1.0));
  return texelFetch(uScene, p, 0).rgb;
}
vec3 sampleLinear(vec2 uv) {
  return texture(uScene, clamp(uv, vec2(0.5) / uVirtual, 1.0 - vec2(0.5) / uVirtual) * uSceneScale).rgb;
}
// 9-tap bilinear Catmull-Rom (Jimenez) for a sharp but smooth upscale.
vec3 sampleCatmullRom(vec2 uv) {
  vec2 samplePos = uv * uVirtual;
  vec2 texPos1 = floor(samplePos - 0.5) + 0.5;
  vec2 f = samplePos - texPos1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 offset12 = w2 / w12;
  vec2 texPos0 = (texPos1 - 1.0) / uVirtual;
  vec2 texPos3 = (texPos1 + 2.0) / uVirtual;
  vec2 texPos12 = (texPos1 + offset12) / uVirtual;
  vec3 result = vec3(0.0);
  result += sampleLinear(vec2(texPos0.x, texPos0.y)) * w0.x * w0.y;
  result += sampleLinear(vec2(texPos12.x, texPos0.y)) * w12.x * w0.y;
  result += sampleLinear(vec2(texPos3.x, texPos0.y)) * w3.x * w0.y;
  result += sampleLinear(vec2(texPos0.x, texPos12.y)) * w0.x * w12.y;
  result += sampleLinear(vec2(texPos12.x, texPos12.y)) * w12.x * w12.y;
  result += sampleLinear(vec2(texPos3.x, texPos12.y)) * w3.x * w12.y;
  result += sampleLinear(vec2(texPos0.x, texPos3.y)) * w0.x * w3.y;
  result += sampleLinear(vec2(texPos12.x, texPos3.y)) * w12.x * w3.y;
  result += sampleLinear(vec2(texPos3.x, texPos3.y)) * w3.x * w3.y;
  return max(result, 0.0);
}
void main() {
  vec2 d = vUv - 0.5;
  // Barrel distortion of the picture tube.
  vec2 uv = 0.5 + d * (1.0 + uBarrel * dot(d, d) * 2.2);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec3 nearest = fetchNearest(uv);
  vec3 smoothed = uSmooth > 0.001 ? sampleCatmullRom(uv) : nearest;
  vec3 col = mix(nearest, smoothed, uSmooth);

  // Grading in display space.
  float l = luma(col);
  col = mix(vec3(l), col, uSaturation);
  col = (col - 0.5) * uContrast + 0.5;

  // Scanlines and the aperture grille are applied per output pixel in the
  // composite pass so they are never resampled through the tilt.
  col *= 1.0 - uVignette * smoothstep(0.35, 1.25, length(d) * 2.0);
  col *= inside;
  fragColor = vec4(toLinear(clamp(col, 0.0, 1.0)), 1.0);
}
`;

export const LIGHTING_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;    // linear light, device resolution
uniform vec2 uTexel;
uniform vec2 uLight;         // uv of the light (0..1)
uniform float uAspect;
uniform float uStrength;
uniform float uShadows;
in vec2 vUv;
out vec4 fragColor;
${COMMON}
void main() {
  vec3 col = texture(uScene, vUv).rgb;
  float l0 = luma(texture(uScene, vUv + vec2(-uTexel.x, 0.0)).rgb);
  float l1 = luma(texture(uScene, vUv + vec2( uTexel.x, 0.0)).rgb);
  float l2 = luma(texture(uScene, vUv + vec2(0.0, -uTexel.y)).rgb);
  float l3 = luma(texture(uScene, vUv + vec2(0.0,  uTexel.y)).rgb);
  // Height from luminance; relief normal.
  vec3 n = normalize(vec3((l0 - l1) * 6.0, (l2 - l3) * 6.0, 1.0));
  vec2 toLight = (uLight - vUv) * vec2(uAspect, 1.0);
  vec3 L = normalize(vec3(toLight, 0.75));
  float diffuse = max(dot(n, L), 0.0);
  vec3 V = vec3(0.0, 0.0, 1.0);
  float spec = pow(max(dot(reflect(-L, n), V), 0.0), 28.0);
  // Cheap ambient occlusion: dark pixels next to bright neighbours sink in.
  float lum = luma(col);
  float around = 0.25 * (l0 + l1 + l2 + l3);
  float occlusion = clamp((around - lum) * 1.5, 0.0, 1.0);
  vec3 lit = col * mix(1.0, 0.72 + 0.55 * diffuse, uStrength) * (1.0 - 0.35 * uStrength * occlusion);
  lit += uStrength * spec * 0.35 * (0.3 + col);
  // Screen-space contact shadows: march toward the light over the luminance
  // height field; anything higher on the way casts a soft shadow here.
  if (uShadows > 0.001) {
    vec2 stepUv = normalize(toLight + vec2(1e-5)) * uTexel * 2.5 / vec2(uAspect, 1.0);
    float shadow = 0.0;
    for (int i = 1; i <= 10; i++) {
      float hs = luma(texture(uScene, vUv + stepUv * float(i)).rgb);
      shadow = max(shadow, hs - lum - float(i) * 0.03);
    }
    lit *= 1.0 - uShadows * 0.55 * clamp(shadow * 2.5, 0.0, 1.0);
  }
  fragColor = vec4(lit, 1.0);
}
`;

export const COMPOSITE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;    // linear light
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uAberration;   // output pixels
uniform float uGrain;
uniform float uTime;
uniform vec2 uOutput;
uniform float uScanlines;
uniform float uMask;
uniform vec2 uVirtual;
uniform sampler2D uShafts;
uniform float uShaftStrength;
uniform sampler2D uFlare;
uniform float uFlareStrength;
uniform float uDust;
uniform float uGrade;
uniform vec2 uLight;
// Perspective tilt (see src/lib/console/tilt.ts for the same math in TS)
uniform float uRx;
uniform float uRy;
uniform float uAspect;
uniform float uDist;
uniform float uShrink;
uniform vec3 uBackground;
in vec2 vUv;
out vec4 fragColor;
${COMMON}
vec3 rotateV(vec3 v, float rx, float ry) {
  float cx = cos(rx), sx = sin(rx), cy = cos(ry), sy = sin(ry);
  float y1 = v.y * cx - v.z * sx;
  float z1 = v.y * sx + v.z * cx;
  return vec3(v.x * cy + z1 * sy, y1, -v.x * sy + z1 * cy);
}
vec3 rotateInv(vec3 v, float rx, float ry) {
  float cx = cos(rx), sx = sin(rx), cy = cos(ry), sy = sin(ry);
  float x1 = v.x * cy - v.z * sy;
  float z1 = v.x * sy + v.z * cy;
  return vec3(x1, v.y * cx + z1 * sx, -v.y * sx + z1 * cx);
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec2 s = vUv * 2.0 - 1.0;
  float W = uAspect * uShrink;
  float H = uShrink;
  vec3 D = vec3(s.x * uAspect, s.y, uDist);
  vec3 n = rotateV(vec3(0.0, 0.0, 1.0), uRx, uRy);
  float denom = dot(D, n);
  vec2 uv = vec2(-1.0);
  if (abs(denom) > 1e-6) {
    float t = (uDist * n.z) / denom;
    vec3 P = vec3(D.xy * t, -uDist + D.z * t);
    vec3 L = rotateInv(P, uRx, uRy);
    uv = vec2((L.x / W + 1.0) * 0.5, (L.y / H + 1.0) * 0.5);
  }
  // Anti-aliased edge of the tilted plane.
  vec2 edge = min(uv, 1.0 - uv);
  float fw = max(fwidth(uv.x), fwidth(uv.y));
  float cover = smoothstep(-fw, fw, min(edge.x, edge.y));

  vec2 d = uv - 0.5;
  vec2 ca = d * dot(d, d) * uAberration * 4.0 / uOutput;
  vec3 scene;
  scene.r = texture(uScene, uv + ca).r;
  scene.g = texture(uScene, uv).g;
  scene.b = texture(uScene, uv - ca).b;
  // CRT: scanlines follow the picture's virtual rows (through the tilt), the
  // aperture grille follows real output columns. Bloom glows over the mask.
  float row = uv.y * uVirtual.y;
  float scan = mix(1.0, 0.55 + 0.45 * abs(sin(3.14159265 * row)), uScanlines);
  int gc = int(gl_FragCoord.x) % 3;
  vec3 grille = gc == 0 ? vec3(1.0, 0.62, 0.62) : (gc == 1 ? vec3(0.62, 1.0, 0.62) : vec3(0.62, 0.62, 1.0));
  scene *= scan * mix(vec3(1.0), grille * 1.18, uMask);
  vec3 bloom = texture(uBloom, uv).rgb;
  vec3 col = scene + bloom * uBloomStrength;
  col += texture(uShafts, uv).rgb * uShaftStrength * 0.55;
  col += texture(uFlare, uv).rgb * uFlareStrength * 0.6;

  // Dust motes drifting through the light.
  if (uDust > 0.001) {
    float dust = 0.0;
    for (int i = 0; i < 36; i++) {
      float fi = float(i);
      vec2 p0 = vec2(hash12(vec2(fi, 1.7)), hash12(vec2(fi, 9.1)));
      vec2 vel = (vec2(hash12(vec2(fi, 3.3)), hash12(vec2(fi, 5.5))) - 0.5) * 0.015 + vec2(0.0, 0.006);
      vec2 p = fract(p0 + vel * uTime);
      vec2 dd = (uv - p) * vec2(uAspect, 1.0);
      float r = 0.002 + 0.003 * hash12(vec2(fi, 7.7));
      float tw = 0.55 + 0.45 * sin(uTime * (0.8 + 1.5 * hash12(vec2(fi, 2.2))) + fi);
      dust += smoothstep(r, r * 0.2, length(dd)) * tw;
    }
    float nearLight = 0.35 + 0.65 * smoothstep(1.0, 0.0, length((uLight - uv) * vec2(uAspect, 1.0)));
    col += dust * uDust * 0.5 * nearLight * vec3(1.0, 0.95, 0.85);
  }

  // Filmic split tone: cool shadows, warm highlights.
  if (uGrade > 0.001) {
    float l = clamp(luma(col), 0.0, 1.0);
    vec3 graded = col * (1.0 + vec3(-0.06, 0.0, 0.10) * (1.0 - l) + vec3(0.08, 0.03, -0.06) * l);
    col = mix(col, graded, uGrade);
  }
  col = aces(col * 1.05);
  col = toSrgb(col);
  col = mix(uBackground, col, cover);

  float g = hash12(gl_FragCoord.xy + fract(uTime * 0.61) * 977.0) - 0.5;
  col += g * uGrain * 0.18;
  col += (hash12(gl_FragCoord.yx * 1.7 + uTime) - 0.5) * (2.0 / 255.0);
  fragColor = vec4(col, 1.0);
}
`;

export const SHAFTS_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;    // the blurred bloom chain (already thresholded)
uniform vec2 uLight;         // uv of the light
in vec2 vUv;
out vec4 fragColor;
${COMMON}
// Volumetric light shafts: radial blur of the soft highlights toward the light.
void main() {
  vec2 toL = uLight - vUv;
  vec2 stepUv = toL / 24.0;
  vec2 uv = vUv;
  vec3 acc = vec3(0.0);
  float w = 1.0;
  for (int i = 0; i < 24; i++) {
    uv += stepUv;
    acc += texture(uScene, clamp(uv, 0.0, 1.0)).rgb * w;
    w *= 0.92;
  }
  float falloff = smoothstep(1.2, 0.15, length(toL));
  fragColor = vec4(acc / 24.0 * 1.2 * falloff, 1.0);
}
`;

export const FLARE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform vec2 uDir;
uniform vec3 uTint;
in vec2 vUv;
out vec4 fragColor;
// Wide directional blur; run twice horizontally for an anamorphic streak.
void main() {
  vec3 acc = vec3(0.0);
  float ws = 0.0;
  for (int i = -12; i <= 12; i++) {
    float w = 1.0 - abs(float(i)) / 13.0;
    acc += texture(uTex, vUv + uDir * uTexel * float(i) * 2.0).rgb * w;
    ws += w;
  }
  fragColor = vec4(acc / ws * uTint, 1.0);
}
`;
