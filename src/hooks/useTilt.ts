'use client';

import { useEffect } from 'react';
import { lerp, q } from '@/lib/lerp';

const MAX_DEG = 7; // tilt at the tile's edge
const FOLLOW = 0.14; // how fast the tilt chases the cursor
const RELEASE = 0.1; // and how fast it lies back down

/**
 * Tilt-on-hover, the danielsun.space kind: the element leans toward the
 * cursor in perspective — the edge under the pointer dips, the far one
 * rises — and lies flat again when the pointer leaves. Transform-only, on
 * its own rAF, smoothed both ways so it never snaps. Mouse pointers only;
 * a finger has no hover to speak of.
 */
export function useTilt(ref: React.RefObject<HTMLElement | null>, enabled: boolean, max = MAX_DEG) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let over = false;
    let raf = 0;

    const loop = () => {
      const k = over ? FOLLOW : RELEASE;
      cx = lerp(cx, tx, k);
      cy = lerp(cy, ty, k);
      if (!over && Math.abs(cx) < 0.02 && Math.abs(cy) < 0.02) {
        cx = cy = 0;
        el.style.transform = '';
        raf = 0;
        return;
      }
      el.style.transform = `perspective(1000px) rotateX(${q(cx)}deg) rotateY(${q(cy)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      // Top edge under the cursor → tip back (negative X rotation); right
      // edge → turn right.
      tx = -ny * max;
      ty = nx * max;
      over = true;
      kick();
    };
    const onLeave = () => {
      over = false;
      tx = ty = 0;
      kick();
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
    };
  }, [ref, enabled, max]);
}
