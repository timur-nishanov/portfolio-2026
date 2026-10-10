'use client';

import { useEffect, useRef } from 'react';
import { showcase } from '@/data/showcase';
import { CaseCard } from './CaseCard';
import './showcase.css';

// How the card beneath goes as the next one slides over it: it shrinks a
// little toward its top edge, blurs, and fades out completely by the time it
// is covered.
const COVERED_SCALE = 0.08;
const COVERED_RISE = 56; // px it drifts up as it recedes, a slower layer behind
const COVERED_BLUR = 10; // px
const COVERED_DIM = 0.06; // darker by this much once covered — depth without a shadow
// Parking is eased: a sticky card would ride the scroll at full speed and
// stop dead on its line, a jolt every time. Instead its speed fades out over
// roughly ±2.5·SETTLE px around the line (a softplus curve), so it glides in
// and settles, and the scroll never meets a wall. At the line it trails by
// ~22px, which the gap between cards (showcase.css) is wide enough to absorb.
const SETTLE = 32;
// How far the next card has come over (0..1) before the one beneath starts
// to shrink, blur and fade.
const RECEDE_FROM = 0.4;

/** The cases after the hero (#works, the menu's "Works"). */
export function CaseShowcase() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>('.cs-card')];
    if (cards.length < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    // The rise each card was last given, so its place can be read back out of
    // its rect without the lift feeding into its own progress.
    const rise = cards.map(() => 0);
    // Each card's offset within the section in normal flow (sticky aside).
    let flow: number[] = [];
    let gaps: number[] = [];
    const measure = () => {
      const cs = getComputedStyle(root);
      let y = parseFloat(cs.paddingTop);
      gaps = cards.map((c, i) => (i > 0 ? parseFloat(getComputedStyle(c).marginTop) : 0));
      flow = cards.map((c, i) => {
        y += gaps[i];
        const at = y;
        y += c.offsetHeight;
        return at;
      });
    };
    const softplus = (x: number) => (x > 30 ? x : Math.log1p(Math.exp(x)));
    const update = () => {
      raf = 0;
      const sectionTop = root.getBoundingClientRect().top;
      // The glide: where each card would be in flow, and its eased place.
      const settle = cards.map((card, i) => {
        if (reduced) return 0;
        const park = parseFloat(getComputedStyle(card).top) || 0;
        const t = sectionTop + flow[i];
        const eased = park + SETTLE * softplus((t - park) / SETTLE);
        return eased - Math.max(t, park);
      });
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const last = i === cards.length - 1;
        let p = 0;
        if (!last) {
          // Scaled from its top edge, so the rect's top (less the transform) is its place.
          const top = card.getBoundingClientRect().top + rise[i] - Number(card.dataset.settle || 0);
          const next = cards[i + 1].getBoundingClientRect().top - Number(cards[i + 1].dataset.settle || 0) + settle[i + 1];
          // 0 while the next card is a full card (and the gap) below, 1 once it
          // has slid all the way over and parked on the same line.
          p = Math.min(1, Math.max(0, 1 - (next - top) / (card.offsetHeight + gaps[i + 1])));
          if (p > 0.998) p = 1;
          // The incoming card's light top edge: strongest mid-way, gone once it
          // has parked (there is nothing left under it to part from).
          cards[i + 1].style.setProperty('--lift', (4 * p * (1 - p)).toFixed(3));
        }
        card.dataset.settle = settle[i].toFixed(2);
        // The card beneath stays sharp while the next one starts to slide
        // over it, so it can still be looked at; it recedes over the rest.
        p = Math.min(1, Math.max(0, (p - RECEDE_FROM) / (1 - RECEDE_FROM)));
        p = p * p * (3 - 2 * p);
        if (p === 0) {
          rise[i] = 0;
          card.style.transform = settle[i] > 0.05 ? `translateY(${settle[i].toFixed(2)}px)` : '';
          card.style.filter = '';
          card.style.opacity = '';
          continue;
        }
        if (!reduced) {
          rise[i] = COVERED_RISE * p;
          card.style.transform = `translateY(${(settle[i] - rise[i]).toFixed(2)}px) scale(${1 - COVERED_SCALE * p})`;
          card.style.filter = `blur(${(COVERED_BLUR * p).toFixed(2)}px) brightness(${(1 - COVERED_DIM * p).toFixed(3)})`;
        }
        card.style.opacity = String(1 - p * p);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };
    measure();
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={ref} id="works" aria-label="Works" className="cs">
      {showcase.map((item) => (
        <CaseCard key={item.id} item={item} />
      ))}
    </section>
  );
}
