'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks prefers-reduced-motion. Returns true when the user asked to reduce
 * motion — gate every non-essential animation on this (TZ §14).
 * SSR-safe: starts false, corrects on mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
