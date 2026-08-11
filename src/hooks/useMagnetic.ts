'use client';

import { useEffect } from 'react';
import { clamp, lerp, q } from '@/lib/lerp';
import { settled, stepSpring, type SpringState } from '@/lib/spring';

const RADIUS = 90; // px beyond the border where the magnet engages
const ENGAGE_LERP = 0.15;
const RETURN_SPRING = { stiffness: 220, damping: 20 };

/** A layer that follows the cursor at its own coefficient. */
export type MagneticLayer = {
  ref: React.RefObject<HTMLElement | null>;
  /** Fraction of the centre→cursor vector this layer travels. */
  factor: number;
  /** Per-layer px cap. */
  max: number;
};

/**
 * Shared magnetic-follow driver (TZ §5.5). Layers move at different
 * coefficients so the label lags the surface — that lag is what stops it
 * looking cheap. Transform-only: engage smooths with a lerp, release settles
 * with a spring. Deliberately gentle; a strong pull reads as chaotic.
 *
 * The root element itself is never transformed, so callers can still measure
 * its box (the nav pill's FLIP depends on that).
 */
export function useMagnetic(
  rootRef: React.RefObject<HTMLElement | null>,
  layers: MagneticLayer[],
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    const resolved = layers
      .map((l) => ({ el: l.ref.current, factor: l.factor, max: l.max }))
      .filter((l): l is { el: HTMLElement; factor: number; max: number } => !!l.el);
    if (resolved.length === 0) return;

    let curX = 0;
    let curY = 0;
    let targetX = 0;
    let targetY = 0;
    let engaged = false;
    let sx: SpringState = { value: 0, velocity: 0 };
    let sy: SpringState = { value: 0, velocity: 0 };
    let raf = 0;
    let last = performance.now();

    const apply = () => {
      for (const l of resolved) {
        const x = clamp(curX * l.factor, -l.max, l.max);
        const y = clamp(curY * l.factor, -l.max, l.max);
        l.el.style.transform = `translate3d(${q(x)}px, ${q(y)}px, 0)`;
      }
    };

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (engaged) {
        curX = lerp(curX, targetX, ENGAGE_LERP);
        curY = lerp(curY, targetY, ENGAGE_LERP);
        sx = { value: curX, velocity: 0 };
        sy = { value: curY, velocity: 0 };
      } else {
        sx = stepSpring(sx, 0, RETURN_SPRING, dt);
        sy = stepSpring(sy, 0, RETURN_SPRING, dt);
        curX = sx.value;
        curY = sy.value;
      }
      apply();
      if (engaged || !settled(sx, 0) || !settled(sy, 0)) {
        raf = requestAnimationFrame(loop);
      } else {
        curX = curY = 0;
        apply();
        raf = 0;
      }
    };

    // Pointer events do not reach a surface covered by an open dialog, but this
    // listener is on the window and hears them anyway — so the header's buttons
    // used to keep leaning toward a cursor that was busy reading the case study.
    // Anything outside the dialog stands down while one is open.
    const inDialog = !!root.closest('dialog');

    const onMove = (e: PointerEvent) => {
      if (!inDialog && document.documentElement.hasAttribute('data-modal-open')) {
        // Release rather than freeze: whatever offset it was holding springs
        // back to zero, so nothing is left leaning behind the sheet.
        if (engaged) {
          engaged = false;
          targetX = 0;
          targetY = 0;
          if (!raf) {
            last = performance.now();
            raf = requestAnimationFrame(loop);
          }
        }
        return;
      }
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      // Distance measured from the border box, not the centre.
      const outX = Math.max(0, Math.abs(dx) - r.width / 2);
      const outY = Math.max(0, Math.abs(dy) - r.height / 2);
      if (Math.hypot(outX, outY) <= RADIUS) {
        engaged = true;
        targetX = dx;
        targetY = dy;
      } else {
        engaged = false;
        targetX = 0;
        targetY = 0;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      for (const l of resolved) l.el.style.transform = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
