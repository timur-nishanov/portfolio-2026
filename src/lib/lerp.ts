export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

/** Round to sub-pixel precision so transforms don't churn the compositor. */
export const q = (v: number): number => Math.round(v * 100) / 100;
