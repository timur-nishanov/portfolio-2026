'use client';

import Lenis from 'lenis';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type FrameCb = (scrollY: number) => void;

type ScrollApi = {
  /** Register a per-frame callback driven by the single rAF loop. Returns an unsubscribe. */
  register: (cb: FrameCb) => () => void;
  /** Smoothly scroll to an element id or offset. Falls back to native when reduced. */
  scrollTo: (target: string | number, opts?: { offset?: number; duration?: number }) => void;
  /** Park the page scroller while something else owns the scroll (the case study). */
  setPaused: (paused: boolean) => void;
};

const noop = () => {};
const ScrollContext = createContext<ScrollApi>({ register: () => noop, scrollTo: noop, setPaused: noop });

export const useSmoothScroll = () => useContext(ScrollContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  const callbacks = useRef<Set<FrameCb>>(new Set());

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

  const api = useMemo<ScrollApi>(() => ({ register, scrollTo, setPaused }), [register, scrollTo, setPaused]);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
