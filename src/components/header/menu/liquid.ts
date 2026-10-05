/**
 * Geometry helpers for the liquid menu morph: spring presets in the
 * response/damping-ratio terms iOS uses, and the metaball bridge that joins
 * the button to the emerging panel while they are still close.
 */
import type { SpringConfig } from '@/lib/spring';

export type Point = { x: number; y: number };

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

const polar = (c: Point, a: number, r: number): Point => ({
  x: c.x + r * Math.cos(a),
  y: c.y + r * Math.sin(a),
});
const fmt = (p: Point) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/**
 * The classic two-circle metaball connector (after Hiroyuki Sato's gooey
 * blobs): two tangent-ish points on each circle, joined by cubic curves whose
 * handles shrink as the circles part, so the neck thins and then lets go.
 * `spread` (0–0.5) is how far round each circle the neck grips — it is what
 * the morph eases down to make the bridge pinch off.
 *
 * Returns the bridge only (plus the far cap of the second circle); the first
 * circle is the button itself, drawn on top, so the path's straight closing
 * edge through it is never seen.
 */
export function metaballPath(c1: Point, r1: number, c2: Point, r2: number, spread: number): string | null {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  // One circle swallowed by the other: there is no neck to draw.
  if (r1 <= 0 || r2 <= 0 || d <= Math.abs(r1 - r2) + 0.5) return null;

  let u1 = 0;
  let u2 = 0;
  if (d < r1 + r2) {
    // Overlapping: start the neck where the circles intersect.
    u1 = Math.acos(Math.max(-1, Math.min(1, (r1 * r1 + d * d - r2 * r2) / (2 * r1 * d))));
    u2 = Math.acos(Math.max(-1, Math.min(1, (r2 * r2 + d * d - r1 * r1) / (2 * r2 * d))));
  }
  const ang = Math.atan2(dy, dx);
  const maxSpread = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / d)));

  const a1 = ang + u1 + (maxSpread - u1) * spread;
  const a2 = ang - u1 - (maxSpread - u1) * spread;
  const a3 = ang + Math.PI - u2 - (Math.PI - u2 - maxSpread) * spread;
  const a4 = ang - Math.PI + u2 + (Math.PI - u2 - maxSpread) * spread;

  const p1 = polar(c1, a1, r1);
  const p2 = polar(c1, a2, r1);
  const p3 = polar(c2, a3, r2);
  const p4 = polar(c2, a4, r2);

  // Handle length: long while the circles are close (a fat, round neck),
  // collapsing as they separate so the curves straighten into a thin waist.
  const total = r1 + r2;
  const handleBase = Math.min(spread * 2.4, Math.hypot(p1.x - p3.x, p1.y - p3.y) / total);
  const handle = handleBase * Math.min(1, (d * 2) / total);
  const h1 = polar(p1, a1 - Math.PI / 2, r1 * handle);
  const h2 = polar(p2, a2 + Math.PI / 2, r1 * handle);
  const h3 = polar(p3, a3 + Math.PI / 2, r2 * handle);
  const h4 = polar(p4, a4 - Math.PI / 2, r2 * handle);

  return (
    `M${fmt(p1)} C${fmt(h1)} ${fmt(h3)} ${fmt(p3)} ` +
    `A${r2.toFixed(2)} ${r2.toFixed(2)} 0 ${d > r1 ? 1 : 0} 0 ${fmt(p4)} ` +
    `C${fmt(h4)} ${fmt(h2)} ${fmt(p2)} Z`
  );
}
