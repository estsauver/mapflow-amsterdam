/**
 * Perspective tilt of the game plane, shared by the composite shader (per
 * pixel) and pointer hit-testing (per event). Screen coordinates are
 * normalised to [-1, 1] vertically with x scaled by the aspect ratio; plane
 * coordinates are (u, v) in [0, 1] with v up.
 *
 * The plane is rotated by rx about X then ry about Y, scaled by `shrink`, and
 * viewed from a camera at (0, 0, -dist) looking down +z.
 */
export interface TiltConfig {
  rx: number;
  ry: number;
  aspect: number;
  dist: number;
  shrink: number;
}

type V3 = [number, number, number];

function rotate(x: number, y: number, z: number, rx: number, ry: number): V3 {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  return [x * cy + z1 * sy, y1, -x * sy + z1 * cy];
}

function rotateInverse(x: number, y: number, z: number, rx: number, ry: number): V3 {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  return [x1, y * cx + z1 * sx, -y * sx + z1 * cx];
}

export function screenFromPlane(u: number, v: number, c: TiltConfig): { x: number; y: number } {
  const W = c.aspect * c.shrink, H = c.shrink;
  const P = rotate((2 * u - 1) * W, (2 * v - 1) * H, 0, c.rx, c.ry);
  const k = c.dist / (P[2] + c.dist);
  return { x: (P[0] * k) / c.aspect, y: P[1] * k };
}

/** Inverse mapping; null when the view ray is parallel to the plane. */
export function planeFromScreen(sx: number, sy: number, c: TiltConfig): { u: number; v: number } | null {
  const W = c.aspect * c.shrink, H = c.shrink;
  const D: V3 = [sx * c.aspect, sy, c.dist];
  const n = rotate(0, 0, 1, c.rx, c.ry);
  const denom = D[0] * n[0] + D[1] * n[1] + D[2] * n[2];
  if (Math.abs(denom) < 1e-9) return null;
  const t = (c.dist * n[2]) / denom;
  const P: V3 = [D[0] * t, D[1] * t, -c.dist + D[2] * t];
  const L = rotateInverse(P[0], P[1], P[2], c.rx, c.ry);
  return { u: (L[0] / W + 1) / 2, v: (L[1] / H + 1) / 2 };
}
