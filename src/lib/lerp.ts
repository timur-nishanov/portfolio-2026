export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

/** Round to sub-pixel precision so transforms don't churn the compositor. */
export const q = (v: number): number => Math.round(v * 100) / 100;

/**
 * Smoothstep-shaped ease for a -1..1 scroll-progress value (sign-preserving):
 * slow near 0 and near the ends, fastest through the middle — reads as a drift
 * settling in and out rather than a constant-speed slide.
 */
export const easeInOut = (x: number): number => {
  const s = Math.sign(x);
  const a = Math.min(Math.abs(x), 1);
  return s * (a * a * (3 - 2 * a));
};
