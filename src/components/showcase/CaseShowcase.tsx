'use client';

import { useEffect, useRef } from 'react';
import { showcase } from '@/data/showcase';
import { loadAllCases } from '@/components/case/registry';
import { cancelFrame, scheduleFrame, type FrameJob } from '@/lib/frame';
import { CaseCard } from './CaseCard';
import './showcase.css';

// How the card beneath goes as the next one slides over it: it shrinks a
// little toward its top edge, dims, and fades out completely by the time it
// is covered. No blur: blurring a whole card again every frame of the slide
// was the heaviest thing on the page, two to three times the GPU's work of
// every other frame, and it fell on every card change (measured; a smaller
// radius cost more still, as the browser blurs a wide one on a smaller copy).
const COVERED_SCALE = 0.08;
const COVERED_RISE = 56; // px it drifts up as it recedes, a slower layer behind
const COVERED_DIM = 0.06; // darker by this much once covered — depth without a shadow
// Parking is eased: a sticky card would ride the scroll at full speed and
// stop dead on its line, a jolt every time. Instead its speed fades out over
// roughly ±2.5·SETTLE px around the line (a softplus curve), so it glides in
// and settles, and the scroll never meets a wall. At the line it trails by
// ~22px, which the gap between cards (showcase.css) is wide enough to absorb.
const SETTLE = 32;
// How far the next card has come over (0..1) before the one beneath starts
// to shrink, dim and fade.
const RECEDE_FROM = 0.4;
// How far back out from under the next card a covered one has to come
// (of its recede, 1 covered) before its clip starts over: half way, where it
// is three quarters there, not the moment the first sliver shows.
const UNCOVERED = 0.5;

/** The cases after the hero (#works, the menu's "Work"). */
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
    // Whether the cards stack at all: on a screen too short for it they
    // follow one another (showcase.css), and there is nothing to drive.
    let stacking = true;
    const measure = () => {
      stacking = getComputedStyle(cards[0]).position === 'sticky';
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
    // A card fully covered by the next one (opacity 0) drops its filter, and
    // its clip waits: videos decoding under the stack were the worst of the
    // scroll's cost. It stays in the page for the keyboard and
    // screen readers, as before. Uncovered, its clip starts over, as a card
    // coming back into view does (whether or not it had been playing: one
    // that came back on screen still covered may have been started there).
    const covered = cards.map(() => false);
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
        if (!stacking) {
          cards.forEach((_, i) => {
            for (const prop of ['transform', '--dim', 'opacity', 'will-change', 'pointer-events', '--lift']) put(i, prop, '');
            if (covered[i]) {
              covered[i] = false;
              cards[i].toggleAttribute('data-covered', false);
            }
          });
          return;
        }
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
            put(i, '--dim', '');
            put(i, 'opacity', '');
            put(i, 'will-change', '');
          } else {
            if (!reduced) {
              rise[i] = COVERED_RISE * p;
              put(i, 'transform', `translateY(${(settle[i] - rise[i]).toFixed(2)}px) scale(${1 - COVERED_SCALE * p})`);
              // A new scale every frame had the card drawn over again at it,
              // every frame, all the way down. Receding, it is drawn once at
              // full size and only scaled: a touch soft by the end, as a card
              // going back into the stack may well be.
              put(i, 'will-change', 'transform');
              // The dimming is a black veil over the card (showcase.css),
              // not a filter: a filter had the whole card, clip and all,
              // drawn through it again on every frame of the slide.
              put(i, '--dim', p < 1 ? (COVERED_DIM * p).toFixed(3) : '');
            }
            put(i, 'opacity', String(1 - p * p));
          }
          const gone = p === 1;
          // Faded out it still stood in the pointer's way: its top 56px rise
          // above the parked card, where a click on what looks like the page
          // opened a case nobody could see. From nineteen twentieths on
          // (under a tenth of its opacity), not from the snap: the parked
          // card's glide keeps the recede short of 1 for a hundred pixels
          // more. It keeps its place in the tab order and for screen
          // readers, as before.
          put(i, 'pointer-events', p >= 0.95 ? 'none' : '');
          const video = videos[i];
          if (!video) continue;
          if (gone) {
            covered[i] = true;
            // The notes read it too, and stop taking turns under the stack.
            cards[i].toggleAttribute('data-covered', true);
            if (!video.paused) video.pause();
          } else if (covered[i] && p < UNCOVERED) {
            covered[i] = false;
            cards[i].toggleAttribute('data-covered', false);
            video.currentTime = 0;
            // With motion reduced the clip waits for the pointer, as
            // everywhere (useLazyVideo).
            if (!reduced) video.play().catch(() => {});
          }
        }
      },
    };
    // Only while the section is anywhere near the screen.
    let near = false;
    let asked = false;
    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) scheduleFrame(job);
        // The cases' articles, for the first card that is clicked (registry).
        if (near && !asked) {
          asked = true;
          loadAllCases();
        }
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
    <section ref={ref} id="works" aria-label="Work" className="cs">
      {showcase.map((item) => (
        <CaseCard key={item.id} item={item} />
      ))}
    </section>
  );
}
