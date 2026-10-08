'use client';

import { useEffect, useRef } from 'react';
import { collage, type CollageItem } from '@/data/randomCollage';
import { useLazyVideo } from '@/hooks/useLazyVideo';
import './random-collage.css';

/** A project's clip; its source is attached on approach (useLazyVideo). */
function Clip({ video }: { video: CollageItem['video'] }) {
  const ref = useLazyVideo(video.src);
  return (
    <video
      ref={ref}
      className="rc__video"
      width={video.width}
      height={video.height}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      poster={video.poster}
      aria-label={video.alt}
    />
  );
}

// Past this line (a share of the screen's height from the top) a card stops
// keeping up with the page and creeps on at SPEED of it, so the next one
// catches up and slides over it: the case cards' stacking, but the scroll
// never stops and the gap between the cards closes gradually.
const LINE = 0.1;
const SPEED = 0.15;
const EASE = 48; // px: the slow-down is spread over about ±2.5× this
// How the card beneath goes as the next one comes over it, as the case
// cards do: it shrinks a little toward its top edge, blurs, dims and fades
// out by the time it is covered; it stays sharp for the first stretch.
const RECEDE_FROM = 0.35;
const COVERED_SCALE = 0.08;
const COVERED_BLUR = 10; // px
const COVERED_DIM = 0.06;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const softplus = (x: number) => (x > 30 ? x : Math.log1p(Math.exp(x)));

/**
 * Random (#random, the menu's "Random"), after the work list on rsquare.work:
 * one big clip per project, leaning left or right of centre, with the title
 * under it in the case cards' style. The cards stack as they go: near the top
 * each one slows to a creep, like the about text, while the next scrolls up
 * over it and it recedes and fades. Nothing moves under reduced motion.
 */
export function RandomCollage() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = [...sec.querySelectorAll<HTMLElement>('.rc__item')];
    const cards = items.map((item) => item.firstElementChild as HTMLElement);
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = LINE * window.innerHeight;
      // Where the layout puts each card (the list items never move).
      const tops = items.map((item) => item.getBoundingClientRect().top);
      // How far each card trails its place. Never past the next card's top,
      // so a card can't sink below the one covering it (or the page's end);
      // the last one has nothing to trail behind.
      const lag = tops.map(() => 0);
      for (let i = items.length - 2; i >= 0; i--) {
        const trail = (1 - SPEED) * EASE * softplus((line - tops[i]) / EASE);
        lag[i] = Math.max(0, Math.min(trail, tops[i + 1] + lag[i + 1] - tops[i]));
      }
      for (let i = 0; i < items.length; i++) {
        const card = cards[i];
        // 0 while the next card is still its usual distance below, 1 once it
        // would have come all the way over — measured from the next card's own
        // place, not its trailing one, or the fade would stall once that card
        // starts to trail too.
        const p = i < items.length - 1 ? clamp01(1 - (tops[i + 1] - tops[i] - lag[i]) / (tops[i + 1] - tops[i])) : 0;
        let q = clamp01((p - RECEDE_FROM) / (1 - RECEDE_FROM));
        q = q * q * (3 - 2 * q);
        if (q === 0) {
          card.style.transform = lag[i] > 0.05 ? `translate3d(0, ${lag[i].toFixed(1)}px, 0)` : '';
          card.style.filter = '';
          card.style.opacity = '';
          continue;
        }
        card.style.transform = `translate3d(0, ${lag[i].toFixed(1)}px, 0) scale(${(1 - COVERED_SCALE * q).toFixed(4)})`;
        card.style.filter = `blur(${(COVERED_BLUR * q).toFixed(2)}px) brightness(${(1 - COVERED_DIM * q).toFixed(3)})`;
        card.style.opacity = (1 - q * q).toFixed(3);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section ref={ref} id="random" aria-labelledby="random-heading" className="rc">
      <h2 id="random-heading" className="sr-only">
        Random
      </h2>
      <ul className="rc__list">
        {collage.map((item) => (
          <li
            key={item.id}
            className="rc__item"
            data-side={item.side}
            data-shape={item.video.height > item.video.width ? 'upright' : 'wide'}
          >
            <div className="rc__card">
              <div className="rc__media" style={{ aspectRatio: `${item.video.width} / ${item.video.height}` }}>
                <Clip video={item.video} />
              </div>
              <h3 className="rc__title">{item.title}</h3>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
