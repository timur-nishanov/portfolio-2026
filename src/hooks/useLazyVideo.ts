'use client';

import { useEffect, useRef } from 'react';

/**
 * Attaches a video's source only once it is near the viewport, then plays it
 * while it is on screen.
 *
 * The page ships seven clips. With the source in the markup the browser fetched
 * every one of them up front — around 12MB of video before a single scroll,
 * which is what made the first screens stutter no matter how fast the machine
 * was. Nothing here is preloaded until it is roughly a screen and a half away;
 * the poster covers the gap, and by the time a clip scrolls in it has had time
 * to buffer.
 */
export function useLazyVideo(src: string) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    let attached = false;
    const attach = () => {
      if (attached) return;
      attached = true;
      v.src = src;
      v.load();
    };

    // Start fetching before it arrives, so it is not blank on entry.
    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          attach();
          near.disconnect();
        }
      },
      { rootMargin: '150% 0px 150% 0px' },
    );
    near.observe(v);

    // Play only while actually visible — seven clips running off-screen is
    // both wasted decode work and wasted battery.
    const play = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          attach();
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.1 },
    );
    play.observe(v);

    return () => {
      near.disconnect();
      play.disconnect();
    };
  }, [src]);

  return ref;
}
