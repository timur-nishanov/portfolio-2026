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
 * When a clip near the screen, but not yet on it, may go on the wire. On a
 * wide screen at once. On a phone the first cards are 'near' the moment the
 * page opens (the hero is one screen tall), and their clips, a megabyte or
 * two each, went on the wire beside the head's own picture: on 4G the first
 * screen waited seconds for them. There they wait for the first scroll, or
 * for the page to have loaded and sat a moment idle, whichever comes first;
 * the poster covers the rest, and a card's clip waits to be well in view
 * before it plays anyway.
 */
let settled: Promise<void> | null = null;

/**
 * A play the browser refused (an iPhone in Low Power Mode, Safari set never
 * to autoplay: a muted clip is refused there until the visitor has touched
 * the page) is tried again on the first gesture, for every clip still on
 * screen that was refused. One try and the clips stayed stills all visit.
 * A pointerdown is not a gesture to a browser (lib/audio); these are.
 */
const refused = new Set<HTMLVideoElement>();
let armed = false;
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown'] as const;
function retry() {
  for (const v of Array.from(refused)) {
    refused.delete(v);
    v.play().catch(() => refused.add(v));
  }
  if (!refused.size) {
    armed = false;
    for (const t of GESTURES) window.removeEventListener(t, retry, true);
  }
}
function tryPlay(v: HTMLVideoElement) {
  v.play().catch(() => {
    refused.add(v);
    if (armed) return;
    armed = true;
    for (const t of GESTURES) window.addEventListener(t, retry, true);
  });
}
function heroSettled(): Promise<void> {
  if (settled) return settled;
  settled = new Promise((resolve) => {
    if (!window.matchMedia('(max-width: 899px)').matches || window.scrollY > 0) return resolve();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.removeEventListener('scroll', go);
      resolve();
    };
    window.addEventListener('scroll', go, { passive: true });
    const idle = () => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(go, { timeout: 2500 });
      else setTimeout(go, 1500);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
  });
  return settled;
}

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
    // The case layer scrolls its own box (.cp__scroll, CaseLayer): with the
    // screen as the root, a margin past the screen is clipped off by that
    // box first, and nothing below its fold was ever 'near'. The box is the
    // root there, the screen elsewhere.
    const root = v.closest<HTMLElement>('.cp__scroll');

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
      { root, rootMargin: '150% 0px 150% 0px' },
    );
    let live = true;
    heroSettled().then(() => live && near.observe(v));

    // Play only while actually visible — seven clips running off-screen is
    // both wasted decode work and wasted battery.
    let enough = false;
    let risen = line === undefined;
    // Motion to be reduced: a clip on screen shows its first frame and runs
    // only while the pointer is on it (its card, its figure) or the keyboard
    // is in it, and stops when they leave. Nothing else on the page moves
    // on its own there either.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let wanted = false;
    const decide = () => {
      const seen = enough && risen;
      if (seen === visible) return;
      visible = seen;
      window.clearTimeout(held);
      if (seen) {
        attach();
        if (restart && gone) v.currentTime = 0;
        gone = false;
        if (still && !wanted) return;
        if (hold) held = window.setTimeout(() => tryPlay(v), hold);
        else tryPlay(v);
      } else {
        refused.delete(v);
        v.pause();
      }
    };
    const want = (on: boolean) => {
      wanted = on;
      if (!visible) return;
      if (on) tryPlay(v);
      else {
        refused.delete(v);
        v.pause();
      }
    };
    const onWant = () => want(true);
    const onLeave = () => want(false);
    if (still) {
      target.addEventListener('pointerenter', onWant);
      target.addEventListener('pointerleave', onLeave);
      target.addEventListener('focusin', onWant);
      target.addEventListener('focusout', onLeave);
    }
    const play = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) gone = true;
        const room = Math.min(e.boundingClientRect.height, e.rootBounds?.height ?? Infinity);
        enough = e.isIntersecting && e.intersectionRect.height >= room * share - 1;
        decide();
      },
      { root, threshold: watched ? STEPS : 0.1 },
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
            { root, rootMargin: `0px 0px ${-(1 - line) * 100}% 0px` },
          );
    rise?.observe(target);

    return () => {
      live = false;
      refused.delete(v);
      window.clearTimeout(held);
      near.disconnect();
      play.disconnect();
      rise?.disconnect();
      if (still) {
        target.removeEventListener('pointerenter', onWant);
        target.removeEventListener('pointerleave', onLeave);
        target.removeEventListener('focusin', onWant);
        target.removeEventListener('focusout', onLeave);
      }
    };
  }, [src, poster, watched, share, hold, restart, line, within]);

  return ref;
}
