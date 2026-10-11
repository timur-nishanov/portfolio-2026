/**
 * Helpers for the liquid menu morph: spring presets in the
 * response/damping-ratio terms iOS uses, and the easing ramps it blends with.
 */
import type { SpringConfig } from '@/lib/spring';

/** Spring from a response time (s, one undamped period) and a damping ratio
    (1 = no overshoot) — the same two numbers SwiftUI's `.spring` takes, so the
    feel can be dialled in the vocabulary the reference animation came from. */
export const springOf = (response: number, dampingRatio: number): SpringConfig => {
  const w = (2 * Math.PI) / response;
  return { stiffness: w * w, damping: 2 * dampingRatio * w };
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
