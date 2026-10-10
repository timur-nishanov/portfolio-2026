'use client';

import { useEffect, useRef } from 'react';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';

// How close to the very top the scroll has to be to be carried round to the
// end going up: under the hero there is the blank top of the cases, under its
// place at the end the blank room below — they match only that far.
const NEAR_TOP = 80;

/**
 * The page is a loop, both ways (as on redis.agency). After the last section
 * comes a place the size of the first screen, and past the middle of the page
 * the hero itself — live head and all — is moved down into it; the hero is
 * only ever seen at the very top or the very end, so the move is never seen.
 * Going down, once that place fills the screen the page jumps to the top,
 * where the same hero is; going up from the top, it jumps to the end and the
 * hero goes with it. Each jump keeps the glide in progress, so the scroll
 * just carries on. The header behaves at either end as it does near the top.
 */
export function LoopToStart() {
  const ref = useRef<HTMLDivElement>(null);
  const { register, jumpTo, onIntent } = useSmoothScroll();

  useEffect(() => {
    const slot = ref.current;
    const hero = document.getElementById('main');
    if (!slot || !hero) return;
    let shift = 0; // how far the hero is moved down right now
    const slotTop = () => slot.getBoundingClientRect().top + window.scrollY;
    // Where the hero is at the top or the end, from the middle of the page.
    const place = () => {
      const end = slotTop();
      const heroTop = hero.getBoundingClientRect().top - shift + window.scrollY;
      const next = window.scrollY > end / 2 ? end - heroTop : 0;
      if (next === shift) return;
      shift = next;
      hero.style.transform = shift ? `translate3d(0, ${shift}px, 0)` : '';
    };
    // Down: the place at the end has reached the top of the screen; less
    // however far past it the scroll has run, that is the top of the page.
    // Only on the way down — a jump up lands right on that place.
    let lastY = window.scrollY;
    const check = () => {
      const down = window.scrollY > lastY;
      lastY = window.scrollY;
      const top = slot.getBoundingClientRect().top;
      if (down && top <= 0.5) {
        jumpTo(Math.max(0, -top));
        lastY = window.scrollY;
      }
      place();
    };
    // Up: from the hero at the top to the hero at the end, same offset.
    const back = (offset: number) => {
      jumpTo(slotTop() + offset);
      lastY = window.scrollY;
      place();
    };

    // Smooth scroll: every frame (before it paints, so a jump never shows),
    // and each wheel step before it is applied, to catch one pushing past the
    // top.
    const offFrame = register(check);
    const offIntent = onIntent(({ deltaY, scroll, target }) => {
      if (deltaY < 0 && target + deltaY < 0 && scroll <= NEAR_TOP) back(scroll);
    });
    // Native scroll: touch always, the wheel too under reduced motion. Never
    // while a case is open over the page (CaseLayer): its scroll is its own.
    const caseOpen = () => document.documentElement.hasAttribute('data-case-open');
    const onWheel = (e: WheelEvent) => {
      if (document.documentElement.classList.contains('lenis') || caseOpen()) return;
      if (e.deltaY < 0 && window.scrollY <= 0) back(0);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (caseOpen()) return;
      const y = e.touches[0].clientY;
      // A pull down with the page already at the top (or bouncing past it).
      if (window.scrollY <= 0 && y - touchY > 6) back(0);
      touchY = y;
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', place);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    place();
    return () => {
      offFrame();
      offIntent();
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', place);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      hero.style.transform = '';
    };
  }, [register, jumpTo, onIntent]);

  return (
    <div aria-hidden="true">
      {/* The hero's place at the end, one screen like the hero itself. */}
      <div ref={ref} className="h-[calc(100svh/var(--site-zoom))]" />
      {/* Room past it for a scroll to overshoot before the jump: blank, as
          the top of the cases right under the hero is. */}
      <div className="h-[30svh]" />
    </div>
  );
}
