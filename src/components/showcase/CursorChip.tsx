'use client';

import { useEffect, useRef } from 'react';
import { zoomOf } from '@/lib/zoom';

/** The chip's box, CSS px: "Case study" in the notes' 15px with room either
    side, half as tall again as the words, as the header pill is to its
    title. Fixed, so its liquid glass (#lg-chip, CaseShowcase) is drawn for
    exactly this shape. */
export const CHIP = { width: 106, height: 30 };

// Where the chip sits relative to the pointer's tip, so it never hides what
// the cursor points at.
const OFFSET_X = 16;
const OFFSET_Y = 16;
// How near the card's edge it may come: past it, the label would hang off
// the card (on the right) or under the next one (below).
const EDGE = 8;
// How tightly it follows (per second): quick, but with a little give.
const FOLLOW = 22;

/**
 * The glass pill that rides next to the cursor over a case card and says
 * what a click does: "Case study". The header pill's glass, at the size of
 * the card's notes. Mouse only; touch and pens never see it.
 */
export function CursorChip({ zoneRef }: { zoneRef: React.RefObject<HTMLElement | null> }) {
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const chip = chipRef.current;
    if (!zone || !chip) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let shown = false;
    let raf = 0;
    let last = 0;
    let client: { x: number; y: number } | null = null;

    const place = () => {
      chip.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    };
    const target = () => {
      if (!client) return;
      const r = zone.getBoundingClientRect();
      const z = zoomOf(zone);
      // Kept on the card: near its right or bottom edge the label stops
      // there and the pointer runs on over it (it takes no pointer).
      tx = Math.min((client.x - r.left) / z + OFFSET_X, r.width / z - CHIP.width - EDGE);
      ty = Math.min((client.y - r.top) / z + OFFSET_Y, r.height / z - CHIP.height - EDGE);
    };
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 1 / 30);
      last = t;
      const k = 1 - Math.exp(-FOLLOW * dt);
      x += (tx - x) * k;
      y += (ty - y) * k;
      place();
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      client = { x: e.clientX, y: e.clientY };
      target();
      // Appear right at the pointer, then follow.
      x = tx;
      y = ty;
      place();
      chip.dataset.on = '';
      shown = true;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) return onEnter(e);
      client = { x: e.clientX, y: e.clientY };
      target();
      kick();
    };
    const onLeave = () => {
      delete chip.dataset.on;
      delete chip.dataset.down;
      shown = false;
      client = null;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') chip.dataset.down = '';
    };
    const onUp = () => {
      delete chip.dataset.down;
    };
    // The page scrolls under a resting cursor: keep the chip on the pointer,
    // and let it go if the card has slid out from under it.
    const onScroll = () => {
      if (!shown || !client) return;
      const r = zone.getBoundingClientRect();
      if (client.x < r.left || client.x > r.right || client.y < r.top || client.y > r.bottom) return onLeave();
      target();
      kick();
    };

    zone.addEventListener('pointerenter', onEnter);
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    zone.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      zone.removeEventListener('pointerenter', onEnter);
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', onLeave);
      zone.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
    };
  }, [zoneRef]);

  return (
    // aria-hidden: the card's link already says "case study" to a screen
    // reader (CaseCard).
    <div ref={chipRef} className="cs-chip" aria-hidden="true">
      <span className="cs-chip__pill glass-disc" style={{ width: CHIP.width, height: CHIP.height }}>
        Case study
      </span>
    </div>
  );
}
