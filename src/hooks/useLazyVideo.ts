'use client';

import { useEffect, useRef } from 'react';

/**
 * When a clip plays, if not as soon as any of it is on screen: once `share`
 * of it is (of the screen's height, for a clip taller than the screen), with
 * `line` only once its top has come up past that share of the screen's
 * height, `hold` ms after that, and with `restart` from its first frame
 * whenever it comes back after leaving the screen altogether. With `within`
 * (a selector) all of that is read off the nearest box round the clip that
 * matches it rather than the clip itself: a case card, whose screen sits
 * higher or lower in it by the device. The cases' clips are set so
 * (CASE_WATCH): an After under its Before would otherwise have played half
 * through while the Before was still being looked at.
 */
export type VideoWatch = { share: number; hold: number; restart: boolean; line?: number; within?: string };

/** Steps of a twentieth, so the share is seen as it is crossed. */
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20);

/**
 * Attaches a video's source (and its poster) only once it is near the
 * viewport, then plays it while it is on screen.
 *
 * The page ships seven clips. With the source in the markup the browser fetched
 * every one of them up front — around 12MB of video before a single scroll,
 * which is what made the first screens stutter no matter how fast the machine
 * was. Nothing here is preloaded until it is roughly a screen and a half away;
 * the poster covers the gap, and by the time a clip scrolls in it has had time
 * to buffer.
 */
export function useLazyVideo(src: string, poster?: string, watch?: VideoWatch) {
  const ref = useRef<HTMLVideoElement>(null);
  // Read out, so a caller's fresh object each render doesn't set it up again.
  const watched = watch !== undefined;
  const share = watch?.share ?? 0;
  const hold = watch?.hold ?? 0;
  const restart = watch?.restart ?? false;
  const line = watch?.line;
  const within = watch?.within;

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // What is watched for being on screen: the clip, or the box round it.
    const target = (within && v.closest<HTMLElement>(within)) || v;

    let attached = false;
    // Whether it is on screen enough to play, as the play observer last saw it.
    let visible = false;
    // Whether it has been off the screen altogether since it last played.
    let gone = true;
    let held = 0;
    const attach = () => {
      if (attached) return;
      attached = true;
      // The poster too: in the markup, every one of them loaded with the
      // page, ahead of the first screen's own picture.
      if (poster) v.poster = poster;
      v.src = src;
      v.load();
      // autoPlay in the markup starts a clip as soon as it can play, seen or
      // not: one attached on approach, still below the screen, ran unseen
      // until it had come on screen and gone again (in the cases, three or
      // four clips decoding at once where one or two can be seen). Pausing
      // now takes that autoplay back without stopping it from buffering; the
      // play observer starts it once it is actually on screen (and held).
      if (!visible || hold) v.pause();
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
    let enough = false;
    let risen = line === undefined;
    const decide = () => {
      const seen = enough && risen;
      if (seen === visible) return;
      visible = seen;
      window.clearTimeout(held);
      if (seen) {
        attach();
        if (restart && gone) v.currentTime = 0;
        gone = false;
        if (hold) held = window.setTimeout(() => v.play().catch(() => {}), hold);
        else v.play().catch(() => {});
      } else {
        v.pause();
      }
    };
    const play = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) gone = true;
        const room = Math.min(e.boundingClientRect.height, e.rootBounds?.height ?? Infinity);
        enough = e.isIntersecting && e.intersectionRect.height >= room * share - 1;
        decide();
      },
      { threshold: watched ? STEPS : 0.1 },
    );
    play.observe(target);
    // Whether its top has come up past the line: it meets the screen's part
    // above the line.
    const rise =
      line === undefined
        ? null
        : new IntersectionObserver(
            ([e]) => {
              risen = e.isIntersecting;
              decide();
            },
            { rootMargin: `0px 0px ${-(1 - line) * 100}% 0px` },
          );
    rise?.observe(target);

    return () => {
      window.clearTimeout(held);
      near.disconnect();
      play.disconnect();
      rise?.disconnect();
    };
  }, [src, poster, watched, share, hold, restart, line, within]);

  return ref;
}
