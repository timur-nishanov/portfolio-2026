'use client';

import { useEffect, useState } from 'react';
import { cancelFrame, scheduleFrame, type FrameJob } from '@/lib/frame';

/**
 * Header hide-on-scroll state (TZ §5.3). Works off scroll *delta*, not absolute
 * position, with an 8px threshold so trackpad micro-moves don't flicker it.
 * Always visible above scrollY 120 and while the cursor is over the header.
 *
 * `hoveredRef` is a ref rather than a boolean so hovering the header does not
 * re-render it — a re-render mid-hover would restart the nav scramble.
 */
export function useHideOnScroll(hoveredRef: React.RefObject<boolean>): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let acc = 0;
    const THRESHOLD = 8;
    // Read with the other scroll effects' reads (lib/frame): read on its own
    // from the scroll event, the position made the browser restyle the page
    // whenever anything had changed since the last frame.
    let y = last;
    let vh = window.innerHeight;
    const job: FrameJob = {
      read: () => {
        y = window.scrollY;
        vh = window.innerHeight;
      },
      write: () => {
        const delta = y - last;
        last = y;

        if (y < 120) {
          acc = 0;
          setHidden(false);
          return;
        }
        // A jump of more than a screen is the page looping round (LoopToStart),
        // not a scroll down or up.
        if (Math.abs(delta) > vh) return;
        if (Math.sign(delta) !== Math.sign(acc)) acc = 0;
        acc += delta;
        if (acc > THRESHOLD) {
          // Cursor parked on the header pins it open.
          if (!hoveredRef.current) setHidden(true);
          acc = 0;
        } else if (acc < -THRESHOLD) {
          setHidden(false);
          acc = 0;
        }
      },
    };
    const onScroll = () => scheduleFrame(job);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelFrame(job);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hoveredRef]);

  return hidden;
}
