'use client';

import { useEffect, useRef } from 'react';
import { collage, type CollageItem } from '@/data/randomCollage';
import { useLazyVideo } from '@/hooks/useLazyVideo';
import { cancelFrame, scheduleFrame, type FrameJob } from '@/lib/frame';
import './random-collage.css';

/** A project's clip; its source and poster are attached on approach (useLazyVideo). */
function Clip({ video }: { video: CollageItem['video'] }) {
  const ref = useLazyVideo(video.src, video.poster);
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
      aria-label={video.alt}
    />
  );
}

// How far each card lags behind the page each way while it crosses the
// screen, as a share of the screen's height: the upright ones more than the
// wide ones, so the cards drift a little against each other. The same
// numbers are in random-collage.css (--drift).
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
    // Where the browser can tie an animation to the scroll itself, the
    // stylesheet does it (random-collage.css): it then moves with the scroll
    // on the compositor, and a phone's native scroll never leaves it behind.
    if (CSS.supports('animation-timeline: view()')) return;
    const items = [...sec.querySelectorAll<HTMLElement>('.rc__item')];
    const cards = items.map((item) => item.firstElementChild as HTMLElement);
    const rects = items.map(() => ({ top: 0, height: 0 }));
    const drawn = items.map(() => '');
    let vh = 0;
    const job: FrameJob = {
      read: () => {
        vh = window.innerHeight;
        items.forEach((item, i) => {
          // The list item stays where the layout put it; its card moves.
          const r = item.getBoundingClientRect();
          rects[i].top = r.top;
          rects[i].height = r.height;
        });
      },
      write: () => {
        items.forEach((item, i) => {
          const r = rects[i];
          if (r.top + r.height < -vh * 0.2 || r.top > vh * 1.2) return;
          // -1 as the item comes in at the bottom, 1 as it leaves at the top.
          const t = Math.max(-1, Math.min(1, (2 * (vh - r.top)) / (vh + r.height) - 1));
          const drift = DRIFT[item.dataset.shape === 'upright' ? 'upright' : 'wide'];
          const transform = `translate3d(0, ${(t * drift * vh).toFixed(1)}px, 0)`;
          if (transform === drawn[i]) return;
          drawn[i] = transform;
          cards[i].style.transform = transform;
        });
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
    io.observe(sec);
    const schedule = () => {
      if (near) scheduleFrame(job);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelFrame(job);
      io.disconnect();
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
