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

// How far the clip slides inside its frame each way, as a share of the
// frame's height; the clip is that much taller than the frame at each end
// (CSS --travel), so its edges never show.
const TRAVEL = 0.07;

/**
 * Random (#random, the menu's "Random"), after the work list on rsquare.work:
 * one big clip per project, leaning left or right of centre, with the title
 * under it in the case cards' style. As on glossar.app's "Seamless fluency",
 * each clip slides a little inside its frame while the frame crosses the
 * screen, slower than the page, so it reads as lying deeper than the card;
 * nothing moves under reduced motion.
 */
export function RandomCollage() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const frames = [...sec.querySelectorAll<HTMLElement>('.rc__media')];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const frame of frames) {
        const r = frame.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        // -1 as the frame comes in at the bottom, 1 as it leaves at the top.
        const t = (2 * (vh - r.top)) / (vh + r.height) - 1;
        const clip = frame.firstElementChild as HTMLElement;
        clip.style.transform = `translate3d(0, ${(t * TRAVEL * r.height).toFixed(1)}px, 0)`;
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
    <section
      ref={ref}
      id="random"
      aria-labelledby="random-heading"
      className="rc"
      style={{ '--travel': TRAVEL } as React.CSSProperties}
    >
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
            <div className="rc__media" style={{ aspectRatio: `${item.video.width} / ${item.video.height}` }}>
              <Clip video={item.video} />
            </div>
            <h3 className="rc__title">{item.title}</h3>
          </li>
        ))}
      </ul>
    </section>
  );
}
