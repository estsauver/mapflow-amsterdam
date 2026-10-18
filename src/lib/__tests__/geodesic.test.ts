import { describe, it, expect } from 'vitest';
import {
  CRITICAL_IMPACT_PARAMETER,
  SCHWARZSCHILD_RADIUS,
  SHADER_STEP,
  angularMomentumSquared,
  deflectionAngle,
  orbitalEnergy,
  traceRay,
  traceWithShaderSchedule,
} from '../blackhole/geodesic';
import { SCENE_FRAG } from '../blackhole/shaders';

// The shader integrates null geodesics in the Schwarzschild metric with units r_s = 1.
// This JS port uses the identical update rule, so these tests pin the physics the
// visualization relies on: weak-field light bending, the photon capture radius,
// and conservation of angular momentum by the integrator.

describe('the scene shader uses the schedule the tests trace', () => {
  it('interpolates SHADER_STEP into the GLSL', () => {
    expect(SCENE_FRAG).toContain(`clamp(${SHADER_STEP.factor.toFixed(3)} * r, ${SHADER_STEP.min.toFixed(3)}, r > ${SHADER_STEP.farRadius.toFixed(1)} ? ${SHADER_STEP.maxFar.toFixed(3)} : ${SHADER_STEP.maxNear.toFixed(3)})`);
    expect(SCENE_FRAG).toContain(`const float ESCAPE_R = ${SHADER_STEP.escapeRadius.toFixed(1)};`);
  });

  it('every ray from the camera is captured or escapes within the step budget', () => {
    for (let b = 0.25; b <= 9; b += 0.25) {
      const r = traceWithShaderSchedule(b);
      expect(r.exhausted ?? false, `b=${b} exhausted ${SHADER_STEP.maxSteps} steps`).toBe(false);
    }
  });

  it('places the capture boundary near the critical impact parameter with the coarse schedule', () => {
    expect(traceWithShaderSchedule(CRITICAL_IMPACT_PARAMETER - 0.2).captured).toBe(true);
    expect(traceWithShaderSchedule(CRITICAL_IMPACT_PARAMETER + 0.2).captured).toBe(false);
  });
});

describe('Schwarzschild null geodesics (r_s = 1)', () => {
  it('uses units where the Schwarzschild radius is 1', () => {
    expect(SCHWARZSCHILD_RADIUS).toBe(1);
    expect(CRITICAL_IMPACT_PARAMETER).toBeCloseTo((3 * Math.sqrt(3)) / 2, 10);
  });

  it('reproduces the weak-field deflection 2 r_s / b to within 3% at b = 100', () => {
    const b = 100;
    const alpha = deflectionAngle(b);
    expect(alpha).not.toBeNull();
    const expected = 2 / b; // 4GM/(c^2 b) with r_s = 2GM/c^2 = 1
    expect(Math.abs(alpha! - expected) / expected).toBeLessThan(0.03);
  });

  it('bends light more strongly closer in (b = 20 vs b = 100)', () => {
    const near = deflectionAngle(20)!;
    const far = deflectionAngle(100)!;
    expect(near).toBeGreaterThan(far * 4); // ~1/b scaling, with strong-field excess
  });

  it('captures rays inside the critical impact parameter and lets outside rays escape', () => {
    expect(deflectionAngle(2.0)).toBeNull();
    expect(deflectionAngle(2.5)).toBeNull();
    const grazing = deflectionAngle(3.0);
    expect(grazing).not.toBeNull();
    expect(grazing!).toBeGreaterThan(1); // strong-field: well over a radian
  });

  // Kick–drift–kick conserves angular momentum exactly for any central force,
  // so energy is the quantity that actually measures integrator accuracy.
  it('conserves orbital energy to 1e-3 through a close pass (b = 4)', () => {
    const start = { pos: [-60, 4, 0] as [number, number, number], vel: [1, 0, 0] as [number, number, number] };
    const h2 = angularMomentumSquared(start.pos, start.vel);
    const e0 = orbitalEnergy(start.pos, start.vel, h2);
    const end = traceRay(start, { escapeRadius: 60, maxSteps: 200000 });
    expect(end.captured).toBe(false);
    const e1 = orbitalEnergy(end.pos, end.vel, h2);
    expect(Math.abs(e1 - e0) / Math.abs(e0)).toBeLessThan(1e-3);
  });

  it('returns to unit speed once it has escaped back out to its starting radius', () => {
    const start = { pos: [-60, 4, 0] as [number, number, number], vel: [1, 0, 0] as [number, number, number] };
    const end = traceRay(start, { escapeRadius: 60, maxSteps: 200000 });
    const speed = Math.hypot(...end.vel);
    expect(Math.abs(speed - 1)).toBeLessThan(1e-3);
  });
});
