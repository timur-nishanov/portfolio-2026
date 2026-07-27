'use client';

import { useEffect, useState } from 'react';

/** SSR-safe media-query hook. `initial` is what to assume before mount. */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** true on < 768px viewports (TZ §14 mobile degradation). */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/** true when the primary pointer can hover (desktop). Gates hover effects. */
export const useCanHover = () => useMediaQuery('(hover: hover) and (pointer: fine)', true);
