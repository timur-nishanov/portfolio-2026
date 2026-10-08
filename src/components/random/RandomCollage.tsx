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

// How far each card lags behind the page each way while it crosses the
// screen, as a share of the screen's height: the upright ones more than the
// wide ones, so the cards drift a little against each other.
const DRIFT = { wide: 0.035, upright: 0.075 };

/**
 * Random (#random, the menu's "Random"), after the work list on rsquare.work:
 * one big clip per project, leaning left or right of centre, with the title
 * under it in the case cards' style. As the side card in glossar.app's
 * "Seamless fluency", each card moves a touch slower than the page while it
 * crosses the screen, by its own amount, so they read as layers; the clips
 * themselves stay whole. Nothing moves under reduced motion.
 */
export function RandomCollage() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = [...sec.querySelectorAll<HTMLElement>('.rc__item')];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const item of items) {
        // The list item stays where the layout put it; its card moves.
        const r = item.getBoundingClientRect();
        if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) continue;
        // -1 as the item comes in at the bottom, 1 as it leaves at the top.
        const t = Math.max(-1, Math.min(1, (2 * (vh - r.top)) / (vh + r.height) - 1));
        const drift = DRIFT[item.dataset.shape === 'upright' ? 'upright' : 'wide'];
        const card = item.firstElementChild as HTMLElement;
        card.style.transform = `translate3d(0, ${(t * drift * vh).toFixed(1)}px, 0)`;
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
