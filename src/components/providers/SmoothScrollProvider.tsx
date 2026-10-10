'use client';

import Lenis from 'lenis';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type FrameCb = (scrollY: number) => void;
/** A wheel step the smooth scroller is about to apply, with where it is now
    (scroll) and where it was already heading (target). */
type IntentCb = (step: { deltaY: number; scroll: number; target: number }) => void;

type ScrollApi = {
  /** Register a per-frame callback driven by the single rAF loop. Returns an unsubscribe. */
  register: (cb: FrameCb) => () => void;
  /** Smoothly scroll to an element id or offset. Falls back to native when reduced. */
  scrollTo: (target: string | number, opts?: { offset?: number; duration?: number }) => void;
  /** Park the page scroller while something else owns the scroll (the case study). */
  setPaused: (paused: boolean) => void;
  /** Move the page to an offset at once, carrying on any glide in progress
      from there (the page's loop, LoopToStart). */
  jumpTo: (y: number) => void;
  /** Hear each wheel step before the smooth scroller applies it (touch stays
      native and isn't reported). Returns an unsubscribe. */
  onIntent: (cb: IntentCb) => () => void;
};

const noop = () => {};
const ScrollContext = createContext<ScrollApi>({
  register: () => noop,
  scrollTo: noop,
  setPaused: noop,
  jumpTo: noop,
  onIntent: () => noop,
});

export const useSmoothScroll = () => useContext(ScrollContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const callbacks = useRef<Set<FrameCb>>(new Set());
  const intents = useRef<Set<IntentCb>>(new Set());

  const register = useCallback((cb: FrameCb) => {
    callbacks.current.add(cb);
    return () => {
      callbacks.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    // Reduced motion: no Lenis, no rAF parallax. Native scroll only (TZ §14).
    if (reduced) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false, // keep native touch scroll (TZ §13)
    });
    lenisRef.current = lenis;
    // Emitted before Lenis moves its target, so a listener can still move the
    // page first and the step carries on from there.
    // Not while parked: the wheel then belongs to the case on top.
    lenis.on('virtual-scroll', ({ deltaY, event }) => {
      if (event.type.startsWith('touch') || lenis.isStopped) return;
      const step = { deltaY, scroll: lenis.animatedScroll, target: lenis.targetScroll };
      intents.current.forEach((cb) => cb(step));
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      const y = lenis.scroll;
      // One loop feeds every parallax subscriber — no per-element scroll listeners.
      callbacks.current.forEach((cb) => cb(y));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const scrollTo = useCallback<ScrollApi['scrollTo']>((target, opts) => {
    const offset = opts?.offset ?? -100;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: opts?.duration ?? 1.1 });
      return;
    }
    // Reduced-motion / no-Lenis fallback: jump natively.
    const el = typeof target === 'string' ? document.querySelector(target) : null;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: 'auto' });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target + offset, behavior: 'auto' });
    }
  }, []);

  // The case study runs its own Lenis on the dialog; the page's instance has
  // nothing to do meanwhile and should not be integrating a scroll it cannot
  // apply.
  const setPaused = useCallback((paused: boolean) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (paused) lenis.stop();
    else lenis.start();
  }, []);

  const jumpTo = useCallback((y: number) => {
    const lenis = lenisRef.current;
    if (!lenis) {
      window.scrollTo({ top: y, behavior: 'instant' });
      return;
    }
    // Where the smoothing was still heading, so the glide goes on past the
    // jump instead of stopping dead on it.
    const ahead = lenis.targetScroll - lenis.animatedScroll;
    lenis.scrollTo(y, { immediate: true, force: true });
    if (Math.abs(ahead) > 0.5) lenis.scrollTo(y + ahead, { force: true });
  }, []);

  const onIntent = useCallback((cb: IntentCb) => {
    intents.current.add(cb);
    return () => {
      intents.current.delete(cb);
    };
  }, []);

  const api = useMemo<ScrollApi>(
    () => ({ register, scrollTo, setPaused, jumpTo, onIntent }),
    [register, scrollTo, setPaused, jumpTo, onIntent],
  );

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
