/**
 * GLSL ES 3.00 sources for the black hole renderer.
 *
 * Pipeline: scene (ray-marched, HDR) → BloomPass (src/lib/gl) → composite
 * (chromatic aberration, vignette, ACES, gamma, dither, grain).
 */

import { SHADER_STEP } from './geodesic';

/**
 * Ray-marches null geodesics in the Schwarzschild metric (r_s = 1) with the
 * same kick–drift–kick rule as src/lib/blackhole/geodesic.ts. Rays that cross
 * the equatorial plane between DISK_INNER and DISK_OUTER pick up emission from
 * a thin, Keplerian, relativistically beamed accretion disk; rays that escape
 * sample a procedural star field, so the stars are lensed too.
 */
export const SCENE_FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCamPos;
uniform mat3 uCamBasis;      // columns: right, up, forward
uniform float uTanHalfFov;
uniform int uMaxSteps;
uniform float uDiskGain;
uniform int uDebug;          // 0 normal, 1 no disk shading, 2 flat background, 3 constant star footprint, 4 march only

in vec2 vUv;
out vec4 fragColor;

const float PI = 3.14159265359;
const float R_S = 1.0;
const float DISK_INNER = 2.8;
const float DISK_OUTER = 11.0;
const float ESCAPE_R = ${SHADER_STEP.escapeRadius.toFixed(1)};
const int MAX_HITS = 3;      // primary, secondary and tertiary disk images

// ---------- hashing / noise ----------
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 hash32(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yzz) * p3.zyx);
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z);
}
float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * noise3(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return s;
}

// ---------- colour ----------
// Planckian locus fit (Tanner Helland), normalised and squared to approximate linear light.
vec3 blackbody(float kelvin) {
  float t = clamp(kelvin, 1000.0, 20000.0) / 100.0;
  float r = t <= 66.0 ? 1.0 : clamp(1.2929 * pow(t - 60.0, -0.1332), 0.0, 1.0);
  float g = t <= 66.0
    ? clamp(0.3900 * log(t) - 0.6318, 0.0, 1.0)
    : clamp(1.1299 * pow(t - 60.0, -0.0755), 0.0, 1.0);
  float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.5432 * log(t - 10.0) - 1.1962, 0.0, 1.0));
  vec3 c = vec3(r, g, b);
  return c * c;
}

// ---------- background ----------
vec2 signNotZero(vec2 v) {
  return vec2(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0);
}
// Octahedral map (y up) so star cells have roughly even angular size.
vec2 octEncode(vec3 n) {
  n /= (abs(n.x) + abs(n.y) + abs(n.z));
  return n.y >= 0.0 ? n.xz : (1.0 - abs(n.zx)) * signNotZero(n.xz);
}

// Star colour from a 0..1 "temperature" without the blackbody fit: warm → white → blue.
vec3 starTint(float t) {
  vec3 warm = vec3(1.0, 0.62, 0.38);
  vec3 white = vec3(1.0, 0.96, 0.9);
  vec3 blue = vec3(0.62, 0.74, 1.0);
  return t < 0.5 ? mix(warm, white, t * 2.0) : mix(white, blue, t * 2.0 - 1.0);
}

vec3 starCell(vec2 cid, vec2 rel, float cells, float density, float sizeUV, float px, float seed) {
  vec3 h = hash32(cid + seed * 7.13);
  if (h.x > density) return vec3(0.0);
  // Jitter keeps the star away from the cell border; starLayer widens to 3x3 when the
  // footprint could still cross it.
  vec2 center = 0.25 + 0.5 * h.yz;
  float d = length(rel - center) / cells;
  float u = h.x / density;                       // 0..1, independent of the density test
  float sigma = max(sizeUV * (0.6 + 0.8 * u), 0.9 * px);
  // Gaussian footprint, energy-conserving so lensed stars smear instead of brightening.
  float energy = exp(-0.5 * d * d / (sigma * sigma)) * (sizeUV * sizeUV) / (sigma * sigma);
  float mag = pow(fract(u * 7.31), 6.0) * 2.5 + 0.08;
  return starTint(fract(u * 3.17)) * energy * mag;
}

vec3 starLayer(vec2 uv, float cells, float density, float sizeUV, float px, float seed) {
  vec2 g = uv * cells;
  vec2 id = floor(g);
  vec2 f = fract(g);
  // One cell is enough when the widest possible footprint (the brightest star or a
  // lensing-stretched one) stays well inside its cell; otherwise sum the 3x3 block.
  float sigmaMax = max(sizeUV * 1.4, 0.9 * px);
  if (sigmaMax * cells < 0.08) return starCell(id, f, cells, density, sizeUV, px, seed);
  vec3 acc = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      acc += starCell(id + o, f - o, cells, density, sizeUV, px, seed);
    }
  }
  return acc;
}

vec3 background(vec3 dir, float px) {
  vec2 uv = octEncode(dir);
  vec3 col = vec3(0.0);
  col += starLayer(uv, 40.0, 0.07, 0.0022, px, 1.0) * 0.9;
  col += starLayer(uv, 120.0, 0.10, 0.0010, px, 2.0) * 0.45;
  col += starLayer(uv, 320.0, 0.16, 0.0006, px, 3.0) * 0.14;

  // A faint galactic band and some dust (one fbm; the finer detail is a single noise call).
  vec3 bandN = normalize(vec3(0.38, 1.0, 0.22));
  float bandZ = dot(dir, bandN) * 4.2;
  float band = exp(-bandZ * bandZ);
  float neb = band > 0.02 ? fbm(dir * 5.5 + 3.0) * 0.6 + noise3(dir * 13.0 + 9.0) * 0.4 : 0.0;
  col += band * neb * vec3(0.32, 0.40, 0.62) * 0.07;
  col += band * pow(neb, 3.0) * vec3(0.85, 0.58, 0.42) * 0.06;
  col += vec3(0.002, 0.0025, 0.005); // deep-space floor so blacks are not dead
  return col;
}

// ---------- accretion disk ----------
// Returns HDR emission in rgb and opacity in a for a crossing at p, where the
// backward-traced ray is travelling along rayDir (away from the camera).
vec4 diskSample(vec3 p, vec3 rayDir) {
  float r = length(p.xz);
  if (r < DISK_INNER || r > DISK_OUTER) return vec4(0.0);

  float phi = atan(p.z, p.x);
  // Newtonian circular speed sqrt(M/r). The static-observer speed in Schwarzschild is
  // sqrt(M/(r - r_s)), which beams the approaching side ~3x harder; the gentler
  // asymmetry is a deliberate look choice, as in most film renderings.
  float beta = sqrt(0.5 / r);                       // c = 1, M = 1/2
  float gamma = inversesqrt(max(1e-4, 1.0 - beta * beta));
  vec3 tang = normalize(vec3(-p.z, 0.0, p.x));      // orbital direction
  vec3 toCam = -normalize(rayDir);
  float doppler = 1.0 / (gamma * (1.0 - beta * dot(tang, toCam)));
  float gravity = sqrt(max(0.0, 1.0 - R_S / r));
  float g = doppler * gravity;                      // observed/emitted frequency ratio

  // Co-rotating turbulence: sheared because omega falls with radius.
  float omega = beta / r;
  float phiRot = phi - omega * uTime * 1.5;
  vec3 cyl = vec3(cos(phiRot), sin(phiRot), 0.0);
  float n1 = fbm(vec3(cyl.xy * 2.4, log(r) * 5.0 + 1.3));
  float n2 = fbm(vec3(cyl.xy * 0.9, log(r) * 16.0 - 4.0));   // azimuthal streaks
  float dens = smoothstep(0.24, 0.86, n1 * 0.55 + n2 * 0.55);
  dens = mix(0.12, 1.0, dens);

  float innerEdge = smoothstep(DISK_INNER, DISK_INNER + 0.35, r);
  float outerEdge = 1.0 - smoothstep(DISK_OUTER - 3.5, DISK_OUTER, r);
  float radial = pow(DISK_INNER / r, 2.3);
  float bright = radial * dens * innerEdge * outerEdge;

  float temp = 6800.0 * pow(DISK_INNER / r, 0.75) * g;
  float beaming = pow(clamp(g, 0.15, 3.0), 3.0);
  vec3 col = blackbody(temp) * bright * beaming * uDiskGain;
  float alpha = clamp(bright * 2.4 + 0.12 * innerEdge * outerEdge, 0.0, 0.93);
  return vec4(col, alpha);
}

void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  float aspect = uResolution.x / uResolution.y;
  vec3 dir = normalize(uCamBasis * vec3(ndc.x * aspect * uTanHalfFov, ndc.y * uTanHalfFov, 1.0));

  vec3 pos = uCamPos;
  vec3 vel = dir;
  vec3 hvec = cross(pos, vel);
  float h2 = dot(hvec, hvec);

  // March first with a small loop body: record where the ray crosses the disk
  // plane and shade those crossings afterwards. Keeping the heavy shading out
  // of the loop keeps the compiled shader small.
  vec3 hitPos0 = vec3(0.0), hitPos1 = vec3(0.0), hitPos2 = vec3(0.0);
  vec3 hitDir0 = vec3(0.0), hitDir1 = vec3(0.0), hitDir2 = vec3(0.0);
  int hits = 0;
  bool captured = false;

  for (int i = 0; i < uMaxSteps; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    if (r < R_S) { captured = true; break; }
    if (r > ESCAPE_R && dot(pos, vel) > 0.0) break;

    float dt = clamp(${SHADER_STEP.factor.toFixed(3)} * r, ${SHADER_STEP.min.toFixed(3)}, r > ${SHADER_STEP.farRadius.toFixed(1)} ? ${SHADER_STEP.maxFar.toFixed(3)} : ${SHADER_STEP.maxNear.toFixed(3)});
    // kick–drift–kick; identical to stepRay() in geodesic.ts
    vec3 a0 = -1.5 * h2 * pos / (r2 * r2 * r);
    vec3 vmid = vel + 0.5 * dt * a0;
    vec3 npos = pos + dt * vmid;
    float nr2 = dot(npos, npos);
    vec3 a1 = -1.5 * h2 * npos / (nr2 * nr2 * sqrt(nr2));
    vec3 nvel = vmid + 0.5 * dt * a1;

    if (pos.y * npos.y < 0.0) {
      float t = pos.y / (pos.y - npos.y);
      vec3 hit = mix(pos, npos, t);
      float hr = length(hit.xz);
      if (hr >= DISK_INNER && hr <= DISK_OUTER) {
        if (hits == 0) { hitPos0 = hit; hitDir0 = nvel; }
        else if (hits == 1) { hitPos1 = hit; hitDir1 = nvel; }
        else { hitPos2 = hit; hitDir2 = nvel; }
        hits++;
        if (hits >= MAX_HITS) break;
      }
    }
    pos = npos;
    vel = nvel;
  }

  vec3 col = vec3(0.0);
  float trans = 1.0;
  if (uDebug == 4) {
    fragColor = vec4(captured ? vec3(0.0) : vec3(0.1 + 0.3 * float(hits)), 1.0);
    return;
  }
  if (uDebug != 1) {
    if (hits > 0) { vec4 d = diskSample(hitPos0, hitDir0); col += trans * d.rgb * d.a; trans *= 1.0 - d.a; }
    if (hits > 1) { vec4 d = diskSample(hitPos1, hitDir1); col += trans * d.rgb * d.a; trans *= 1.0 - d.a; }
    if (hits > 2) { vec4 d = diskSample(hitPos2, hitDir2); col += trans * d.rgb * d.a; trans *= 1.0 - d.a; }
  }

  // Back in uniform control flow: derivatives are valid here.
  vec3 outDir = normalize(vel);
  vec2 ouv = octEncode(outDir);
  float px = uDebug == 3 ? 0.001 : min(max(fwidth(ouv.x), fwidth(ouv.y)), 0.006);
  vec3 bg = uDebug == 2 ? vec3(0.01, 0.01, 0.02) : background(outDir, px);
  if (!captured) col += trans * bg;

  fragColor = vec4(col, 1.0);
}
`;

export const COMPOSITE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStrength;
uniform float uExposure;
uniform float uAberration;
uniform float uTime;
in vec2 vUv;
out vec4 fragColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec3 toSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 d = vUv - 0.5;
  float r2 = dot(d, d);
  vec2 ca = d * r2 * uAberration;
  vec3 scene;
  scene.r = texture(uScene, vUv + ca).r;
  scene.g = texture(uScene, vUv).g;
  scene.b = texture(uScene, vUv - ca).b;
  vec3 bloom = texture(uBloom, vUv).rgb;

  vec3 col = (scene + bloom * uBloomStrength) * uExposure;
  col *= 1.0 - 0.38 * smoothstep(0.15, 0.95, r2 * 2.2);
  col = aces(col);
  col = toSrgb(col);

  float n = hash12(gl_FragCoord.xy + fract(uTime * 0.37) * 1000.0);
  col += (n - 0.5) * (2.0 / 255.0);          // dither out banding in the dark gradients
  col += (hash12(gl_FragCoord.yx * 1.3 + uTime) - 0.5) * 0.012; // faint film grain
  fragColor = vec4(col, 1.0);
}
`;
