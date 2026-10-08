'use client';

import Image from 'next/image';
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

/**
 * Random (#random, the menu's "Random"), after the work list on rsquare.work:
 * one big clip per project, leaning left or right of centre, the title under
 * it in the case cards' style, and stills from the same project laid over its
 * edges. The stills drift a little against the clip as the block scrolls
 * past, so the layers read apart; nothing moves under reduced motion.
 */
export function RandomCollage() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const shots = [...sec.querySelectorAll<HTMLElement>('.rc__shot')];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of shots) {
        // The clip's box (never transformed): -1 as it enters at the bottom,
        // 0 centred, 1 as it leaves at the top.
        const box = (el.parentElement as HTMLElement).getBoundingClientRect();
        const t = Math.max(-1.2, Math.min(1.2, (vh / 2 - (box.top + box.height / 2)) / vh));
        el.style.transform = `translate3d(0, ${(t * Number(el.dataset.drift)).toFixed(1)}px, 0)`;
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
          <li key={item.id} className="rc__item" data-side={item.side}>
            <div className="rc__media" style={{ aspectRatio: `${item.video.width} / ${item.video.height}` }}>
              <Clip video={item.video} />
              {item.shots.map((shot) => (
                <div
                  key={shot.src}
                  className="rc__shot"
                  data-drift={shot.drift}
                  style={
                    {
                      '--x': `${shot.x}%`,
                      '--y': `${shot.y}%`,
                      '--w': `${shot.w}%`,
                      '--mx': `${shot.mx}%`,
                      '--my': `${shot.my}%`,
                      '--mw': `${shot.mw}%`,
                    } as React.CSSProperties
                  }
                >
                  {/* Stills from the clip itself: decoration, the clip's label covers them. */}
                  <Image
                    src={shot.src}
                    width={shot.width}
                    height={shot.height}
                    sizes="(max-width: 899px) 40vw, 400px"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
            <h3 className="rc__title">{item.title}</h3>
          </li>
        ))}
      </ul>
    </section>
  );
}
