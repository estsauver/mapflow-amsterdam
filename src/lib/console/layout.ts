/** Logical height every game lays out against; width follows the aspect ratio. */
export const LOGICAL_HEIGHT = 540;

export interface FrameInput {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  /** Desired virtual (rendered) height in pixels; clamped to the device height. */
  virtualHeight: number;
  maxDeviceWidth?: number;
  maxDeviceHeight?: number;
  maxDpr?: number;
}

export interface Frame {
  aspect: number;
  logicalWidth: number;
  logicalHeight: number;
  /** Output size in device pixels. */
  deviceWidth: number;
  deviceHeight: number;
  /** Virtual (rendered) size in pixels. */
  vw: number;
  vh: number;
  /** Virtual pixels per logical pixel. */
  scale: number;
}

export function computeFrame(i: FrameInput): Frame {
  if (!(i.cssWidth > 0) || !(i.cssHeight > 0)) throw new Error(`invalid css size ${i.cssWidth}x${i.cssHeight}`);
  if (!(i.virtualHeight > 0)) throw new Error(`invalid virtual height ${i.virtualHeight}`);
  const dpr = Math.min(i.maxDpr ?? 2, Math.max(1, i.dpr || 1));
  const aspect = i.cssWidth / i.cssHeight;
  let deviceWidth = Math.round(i.cssWidth * dpr);
  let deviceHeight = Math.round(i.cssHeight * dpr);
  // Cap both dimensions (aspect preserved) so portrait containers cannot blow the pixel budget.
  const maxW = i.maxDeviceWidth ?? 1920;
  const maxH = i.maxDeviceHeight ?? 1080;
  if (deviceWidth > maxW) {
    deviceHeight = Math.round((deviceHeight * maxW) / deviceWidth);
    deviceWidth = maxW;
  }
  if (deviceHeight > maxH) {
    deviceWidth = Math.round((deviceWidth * maxH) / deviceHeight);
    deviceHeight = maxH;
  }
  deviceWidth = Math.max(1, deviceWidth);
  deviceHeight = Math.max(1, deviceHeight);
  // The device size always wins over the virtual-height floor.
  const vh = Math.min(deviceHeight, Math.max(90, Math.round(i.virtualHeight)));
  const vw = Math.max(1, Math.min(deviceWidth, Math.round(vh * aspect)));
  return {
    aspect,
    logicalWidth: aspect * LOGICAL_HEIGHT,
    logicalHeight: LOGICAL_HEIGHT,
    deviceWidth,
    deviceHeight,
    vw,
    vh,
    scale: vh / LOGICAL_HEIGHT,
  };
}

/** Whole virtual pixels per art pixel, so pixel art stays crisp at low resolutions. */
export function spritePixelSize(scale: number, spriteScale = 4): number {
  return Math.max(1, Math.round(scale * spriteScale));
}
