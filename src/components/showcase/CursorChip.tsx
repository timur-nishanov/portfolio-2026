'use client';

import { useEffect, useRef } from 'react';
import { CHIP, CHIP_DOCK, chipPlace } from './chipPlace';

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
    const notes = zone.querySelector<HTMLElement>('.cs-card__notes');

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
      // Kept on the card, and stepping aside where it would cover the notes,
      // as it does with the pointer on them (chipPlace, showcase.css).
      const at = chipPlace(zone, client.x, client.y, notes);
      tx = at.tx;
      ty = at.ty;
      chip.toggleAttribute('data-aside', at.aside);
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
      delete chip.dataset.gone;
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
      delete chip.dataset.aside;
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

    // A case opening: the chip goes at once (data-gone: no fade), the drop
    // the case grows out of having taken its place in the same frame
    // (caseMorph). It is back once the pointer is over a card again (the
    // browser says so as soon as the case has gone from under it).
    const html = document.documentElement;
    const caseWatch = new MutationObserver(() => {
      if (!html.hasAttribute('data-case-open')) return;
      chip.dataset.gone = '';
      onLeave();
    });
    caseWatch.observe(html, { attributes: true, attributeFilter: ['data-case-open'] });

    // The case closing back into the chip (caseMorph): the drop has landed
    // where the chip goes for this pointer, as the chip, and the chip takes
    // its place in the same frame, with no grow-in; its own transitions are
    // back once it is on screen.
    let docked = 0;
    const onDock = (e: Event) => {
      const at = (e as CustomEvent<{ x: number; y: number }>).detail;
      e.preventDefault();
      chip.dataset.gone = '';
      cancelAnimationFrame(raf);
      raf = 0;
      client = { x: at.x, y: at.y };
      target();
      x = tx;
      y = ty;
      place();
      chip.dataset.on = '';
      shown = true;
      cancelAnimationFrame(docked);
      docked = requestAnimationFrame(() => {
        docked = requestAnimationFrame(() => {
          docked = 0;
          delete chip.dataset.gone;
        });
      });
    };
    zone.addEventListener(CHIP_DOCK, onDock);

    zone.addEventListener('pointerenter', onEnter);
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    zone.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(docked);
      caseWatch.disconnect();
      zone.removeEventListener(CHIP_DOCK, onDock);
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
