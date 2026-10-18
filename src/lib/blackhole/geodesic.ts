/**
 * Null geodesics around a Schwarzschild black hole, in units where the
 * Schwarzschild radius r_s = 1 (so the mass M = 1/2, the photon sphere sits at
 * r = 1.5 and the innermost stable circular orbit at r = 3).
 *
 * The spatial path of a photon obeys
 *
 *     d²x/dλ² = -(3/2) · h² · x / |x|⁵        with  h = |x × dx/dλ|  conserved,
 *
 * which is the vector form of the Binet equation u'' + u = (3/2) r_s u². This
 * is exact for the shape of the orbit; λ is not coordinate time, so |dx/dλ|
 * is only unity far from the hole (energy ½|v|² − ½h²/r³ is conserved).
 *
 * BlackHoleScene's fragment shader integrates the identical update rule
 * (kick–drift–kick with a step proportional to r). Keep the two in sync.
 */

export type Vec3 = [number, number, number];

export const SCHWARZSCHILD_RADIUS = 1;
/** Photons with impact parameter below this (b_c = 3√3/2 · r_s) are captured. */
export const CRITICAL_IMPACT_PARAMETER = (3 * Math.sqrt(3)) / 2;

export interface RayState {
  pos: Vec3;
  vel: Vec3;
}

/**
 * The march schedule used by the scene shader. shaders.ts interpolates these
 * numbers into the GLSL so the tests below exercise exactly what ships.
 * Step length is clamp(factor · r, min, r > farRadius ? maxFar : maxNear).
 */
export const SHADER_STEP = {
  factor: 0.09,
  min: 0.02,
  maxNear: 0.7,
  maxFar: 1.2,
  farRadius: 8,
  maxSteps: 256,
  escapeRadius: 30,
  cameraDistance: 13,
} as const;

export interface TraceOptions {
  /** Stop once |pos| exceeds this and the ray is moving outward. */
  escapeRadius: number;
  maxSteps?: number;
  /** Step length is clamp(stepFactor · r, minStep, r > farRadius ? maxStepFar : maxStep). */
  stepFactor?: number;
  minStep?: number;
  maxStep?: number;
  farRadius?: number;
  maxStepFar?: number;
}

export interface TraceResult extends RayState {
  captured: boolean;
  steps: number;
  /** True when the step budget ran out before capture or escape. */
  exhausted?: boolean;
}

/** Conserved energy of the orbit equation: ½|v|² − ½h²/r³. */
export function orbitalEnergy(pos: Vec3, vel: Vec3, h2: number): number {
  const r = Math.sqrt(dot(pos, pos));
  return 0.5 * dot(vel, vel) - (0.5 * h2) / (r * r * r);
}

/** Trace with the scene shader's schedule from the camera distance, aimed with impact parameter b. */
export function traceWithShaderSchedule(b: number): TraceResult {
  const R = SHADER_STEP.cameraDistance;
  // Start on the camera sphere, heading parallel to -x so the perpendicular offset is b.
  const y = Math.min(b, R * 0.999);
  const x = -Math.sqrt(R * R - y * y);
  return traceRay(
    { pos: [x, y, 0], vel: [1, 0, 0] },
    {
      escapeRadius: SHADER_STEP.escapeRadius,
      maxSteps: SHADER_STEP.maxSteps,
      stepFactor: SHADER_STEP.factor,
      minStep: SHADER_STEP.min,
      maxStep: SHADER_STEP.maxNear,
      farRadius: SHADER_STEP.farRadius,
      maxStepFar: SHADER_STEP.maxFar,
    },
  );
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export function angularMomentumSquared(pos: Vec3, vel: Vec3): number {
  const h = cross(pos, vel);
  return dot(h, h);
}

/** -(3/2) h² x / r⁵ */
export function geodesicAcceleration(pos: Vec3, h2: number): Vec3 {
  const r2 = dot(pos, pos);
  const k = (-1.5 * h2) / (r2 * r2 * Math.sqrt(r2));
  return [pos[0] * k, pos[1] * k, pos[2] * k];
}

/** One kick–drift–kick step. Mirrors the GLSL `stepRay` in BlackHoleScene. */
export function stepRay(state: RayState, h2: number, dt: number): RayState {
  const a0 = geodesicAcceleration(state.pos, h2);
  const half: Vec3 = [
    state.vel[0] + 0.5 * dt * a0[0],
    state.vel[1] + 0.5 * dt * a0[1],
    state.vel[2] + 0.5 * dt * a0[2],
  ];
  const pos: Vec3 = [
    state.pos[0] + dt * half[0],
    state.pos[1] + dt * half[1],
    state.pos[2] + dt * half[2],
  ];
  const a1 = geodesicAcceleration(pos, h2);
  const vel: Vec3 = [
    half[0] + 0.5 * dt * a1[0],
    half[1] + 0.5 * dt * a1[1],
    half[2] + 0.5 * dt * a1[2],
  ];
  return { pos, vel };
}

export function traceRay(start: RayState, opts: TraceOptions): TraceResult {
  const {
    escapeRadius,
    maxSteps = 100000,
    stepFactor = 0.02,
    minStep = 0.002,
    maxStep = 1,
    farRadius = Infinity,
    maxStepFar = maxStep,
  } = opts;
  const h2 = angularMomentumSquared(start.pos, start.vel);
  let state: RayState = { pos: [...start.pos] as Vec3, vel: [...start.vel] as Vec3 };
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.sqrt(dot(state.pos, state.pos));
    if (r < SCHWARZSCHILD_RADIUS) return { ...state, captured: true, steps: i };
    if (r > escapeRadius && dot(state.pos, state.vel) > 0) return { ...state, captured: false, steps: i };
    const dt = Math.min(r > farRadius ? maxStepFar : maxStep, Math.max(minStep, stepFactor * r));
    state = stepRay(state, h2, dt);
  }
  return { ...state, captured: false, steps: maxSteps, exhausted: true };
}

/**
 * Total bending angle (radians, unwrapped) of a photon fired from far away with
 * impact parameter b, or null if the photon falls into the hole.
 */
export function deflectionAngle(b: number): number | null {
  if (!(b > 0)) throw new Error(`impact parameter must be positive, got ${b}`);
  const far = Math.max(2000, 40 * b);
  const h2 = b * b; // |x × v| = b for unit speed at infinity
  let state: RayState = { pos: [-far, b, 0], vel: [1, 0, 0] };
  let swept = 0;
  for (let i = 0; i < 2_000_000; i++) {
    const r = Math.hypot(state.pos[0], state.pos[1]);
    if (r < SCHWARZSCHILD_RADIUS) return null;
    if (r > far && dot(state.pos, state.vel) > 0) return Math.abs(swept);
    const dt = Math.min(1, Math.max(0.002, 0.02 * r));
    const next = stepRay(state, h2, dt);
    // Motion is planar (z = 0); accumulate the signed rotation of the velocity.
    const crossZ = state.vel[0] * next.vel[1] - state.vel[1] * next.vel[0];
    swept += Math.atan2(crossZ, dot(state.vel, next.vel));
    state = next;
  }
  throw new Error('geodesic did not terminate');
}
