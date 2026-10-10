'use client';

import { useEffect, useRef } from 'react';
import { showcase } from '@/data/showcase';
import { cancelFrame, scheduleFrame, type FrameJob } from '@/lib/frame';
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
    // A touch screen scrolls the page natively, on the compositor, and parks
    // a sticky card there in step with it; the glide, written from script a
    // frame or two after the scroll, only made the parking card shake. There
    // it parks as plain sticky.
    const glides = !reduced && !window.matchMedia('(pointer: coarse)').matches;
    const videos = cards.map((c) => c.querySelector('video'));
    // The rise and the glide each card was last given, so its place can be
    // read back out of its rect without them feeding into its own progress.
    const rise = cards.map(() => 0);
    const glide = cards.map(() => 0);
    // Measured once per layout, not every frame: each card's offset within
    // the section in normal flow (sticky aside), the gap above it, its height
    // and the line it parks on.
    let flow: number[] = [];
    let gaps: number[] = [];
    let heights: number[] = [];
    let park: number[] = [];
    const measure = () => {
      const cs = getComputedStyle(root);
      let y = parseFloat(cs.paddingTop);
      gaps = cards.map((c, i) => (i > 0 ? parseFloat(getComputedStyle(c).marginTop) : 0));
      heights = cards.map((c) => c.offsetHeight);
      park = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
      flow = cards.map((c, i) => {
        y += gaps[i];
        const at = y;
        y += heights[i];
        return at;
      });
    };
    // Styles are written only where they change: rewriting the same values
    // every frame still made the browser restyle the cards.
    const written = cards.map(() => new Map<string, string>());
    const put = (i: number, prop: string, value: string) => {
      if (written[i].get(prop) === value) return;
      written[i].set(prop, value);
      cards[i].style.setProperty(prop, value);
    };
    // A card fully covered by the next one isn't drawn at all (nor its blur),
    // and its clip waits: four videos decoding under one card was the worst
    // of the scroll's cost.
    const covered = cards.map(() => false);
    const heldBack = cards.map(() => false);
    const softplus = (x: number) => (x > 30 ? x : Math.log1p(Math.exp(x)));
    let sectionTop = 0;
    const tops = cards.map(() => 0);
    const job: FrameJob = {
      read: () => {
        sectionTop = root.getBoundingClientRect().top;
        cards.forEach((card, i) => {
          tops[i] = card.getBoundingClientRect().top;
        });
      },
      write: () => {
        // The glide: where each card would be in flow, and its eased place.
        const settle = cards.map((_, i) => {
          if (!glides) return 0;
          const t = sectionTop + flow[i];
          const eased = park[i] + SETTLE * softplus((t - park[i]) / SETTLE);
          return eased - Math.max(t, park[i]);
        });
        for (let i = 0; i < cards.length; i++) {
          let p = 0;
          if (i < cards.length - 1) {
            // Scaled from its top edge, so the rect's top (less the transform) is its place.
            const top = tops[i] + rise[i] - glide[i];
            const next = tops[i + 1] - glide[i + 1] + settle[i + 1];
            // 0 while the next card is a full card (and the gap) below, 1 once it
            // has slid all the way over and parked on the same line.
            p = Math.min(1, Math.max(0, 1 - (next - top) / (heights[i] + gaps[i + 1])));
            if (p > 0.998) p = 1;
            // The incoming card's light top edge: strongest mid-way, gone once it
            // has parked (there is nothing left under it to part from).
            put(i + 1, '--lift', (4 * p * (1 - p)).toFixed(3));
          }
          glide[i] = settle[i];
          // The card beneath stays sharp while the next one starts to slide
          // over it, so it can still be looked at; it recedes over the rest.
          p = Math.min(1, Math.max(0, (p - RECEDE_FROM) / (1 - RECEDE_FROM)));
          p = p * p * (3 - 2 * p);
          if (p === 0) {
            rise[i] = 0;
            put(i, 'transform', settle[i] > 0.05 ? `translateY(${settle[i].toFixed(2)}px)` : '');
            put(i, 'filter', '');
            put(i, 'opacity', '');
          } else {
            if (!reduced) {
              rise[i] = COVERED_RISE * p;
              put(i, 'transform', `translateY(${(settle[i] - rise[i]).toFixed(2)}px) scale(${1 - COVERED_SCALE * p})`);
              put(
                i,
                'filter',
                `blur(${(COVERED_BLUR * p).toFixed(2)}px) brightness(${(1 - COVERED_DIM * p).toFixed(3)})`,
              );
            }
            put(i, 'opacity', String(1 - p * p));
          }
          const gone = p === 1;
          if (gone !== covered[i]) {
            covered[i] = gone;
            put(i, 'visibility', gone ? 'hidden' : '');
          }
          const video = videos[i];
          if (!video) continue;
          if (gone && !video.paused) {
            video.pause();
            heldBack[i] = true;
          } else if (!gone && heldBack[i]) {
            heldBack[i] = false;
            video.play().catch(() => {});
          }
        }
      },
    };
    // Only while the section is anywhere near the screen.
    let near = false;
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) scheduleFrame(job);
      },
      { rootMargin: '50% 0px' },
    );
    io.observe(root);
    const schedule = () => {
      if (near) scheduleFrame(job);
    };
    const onResize = () => {
      measure();
      scheduleFrame(job);
    };
    measure();
    job.read?.();
    job.write();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelFrame(job);
      io.disconnect();
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
