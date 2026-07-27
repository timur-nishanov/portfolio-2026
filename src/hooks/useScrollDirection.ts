'use client';

import { useEffect, useState } from 'react';

/**
 * Header hide-on-scroll state (TZ §5.3). Works off scroll *delta*, not absolute
 * position, with an 8px threshold so trackpad micro-moves don't flicker it.
 * Always visible above scrollY 120 and while `hovered` is held by the header.
 */
export function useHideOnScroll(hovered: boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let acc = 0;
    const THRESHOLD = 8;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last;
      last = y;

      if (y < 120) {
        acc = 0;
        setHidden(false);
        return;
      }
      // Accumulate small deltas until they clear the threshold, then commit.
      if (Math.sign(delta) !== Math.sign(acc)) acc = 0;
      acc += delta;
      if (acc > THRESHOLD) {
        setHidden(true);
        acc = 0;
      } else if (acc < -THRESHOLD) {
        setHidden(false);
        acc = 0;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cursor over the header pins it open.
  return hidden && !hovered;
}
