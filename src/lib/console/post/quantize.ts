/** 4×4 Bayer matrix thresholds, (m + 0.5) / 16, same order as the compose shader. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(m => (m + 0.5) / 16);

/**
 * Palette quantisation with ordered dither, in place on RGBA pixels. This is
 * the software twin of the compose shader's quantisation: each channel becomes
 * floor(v · (levels − 1) + d) / (levels − 1) with d = mix(0.5, bayer, dither).
 */
export function quantizeDither(data: Uint8ClampedArray, width: number, height: number, levels: number, dither: number): void {
  if (!(levels >= 2)) throw new Error(`levels must be at least 2, got ${levels}`);
  if (levels >= 256) return;
  const steps = levels - 1;
  const strength = Math.max(0, Math.min(1, dither));
  for (let y = 0; y < height; y++) {
    const rowBayer = (y & 3) * 4;
    for (let x = 0; x < width; x++) {
      const d = 0.5 + (BAYER4[rowBayer + (x & 3)] - 0.5) * strength;
      const i = (y * width + x) * 4;
      data[i] = Math.round((Math.floor((data[i] / 255) * steps + d) / steps) * 255);
      data[i + 1] = Math.round((Math.floor((data[i + 1] / 255) * steps + d) / steps) * 255);
      data[i + 2] = Math.round((Math.floor((data[i + 2] / 255) * steps + d) / steps) * 255);
    }
  }
}
