'use client';

import { useEffect, useRef } from 'react';
import { site } from '@/data/site';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import './loop.css';

// How long the head's fade-in on arrival takes (loop.css runs it).
const ARRIVE_MS = 900;

/**
 * The end of the page runs back into its start. After the last section comes
 * a copy of the first screen (its tagline in the same place; no head), and the
 * moment the copy fills the screen the page jumps to the real one at the top,
 * carrying on whatever glide is in progress, so the scroll just goes on from
 * the hero and round again. Up there the header is back, as near the top it
 * always is, and the head fades in. Only forwards: scrolling up at the top
 * stays at the top.
 */
export function LoopToStart() {
  const ref = useRef<HTMLDivElement>(null);
  const { register, jumpTo } = useSmoothScroll();

  useEffect(() => {
    const copy = ref.current;
    if (!copy) return;
    let timer = 0;
    const check = () => {
      const top = copy.getBoundingClientRect().top;
      if (top > 0.5) return;
      // The copy at the top of the screen, less however far past it the
      // scroll has run, is the hero at that same offset.
      jumpTo(Math.max(0, -top));
      const hero = document.getElementById('main');
      if (!hero) return;
      hero.removeAttribute('data-arrive');
      void hero.offsetWidth; // restart the fade if it is still running
      hero.setAttribute('data-arrive', '');
      clearTimeout(timer);
      timer = window.setTimeout(() => hero.removeAttribute('data-arrive'), ARRIVE_MS);
    };
    // Every frame with smooth scrolling (before it paints, so the jump never
    // shows), and on native scroll where there is none (reduced motion).
    const off = register(check);
    window.addEventListener('scroll', check, { passive: true });
    return () => {
      off();
      window.removeEventListener('scroll', check);
      clearTimeout(timer);
    };
  }, [register, jumpTo]);

  return (
    <div ref={ref} aria-hidden="true" inert>
      {/* The hero, as drawn (Hero): one screen, the tagline at its foot. */}
      <div className="relative h-[calc(100svh/var(--site-zoom))] w-full overflow-hidden">
        <p className="t-title absolute inset-x-4 bottom-[21px] select-none text-center text-ink-strong">
          {site.hero.tagline.map((line) => (
            <span key={line} className="block text-balance">
              {line}
            </span>
          ))}
        </p>
      </div>
      {/* Room past the copy for a scroll to overshoot it before the jump:
          blank, as the top of the cases right under the hero is. */}
      <div className="h-[50svh]" />
    </div>
  );
}
