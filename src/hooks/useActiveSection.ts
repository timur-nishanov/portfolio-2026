'use client';

import { useEffect, useState } from 'react';

/**
 * Active-section detection via IntersectionObserver (TZ §5.2).
 * rootMargin narrows the trigger band to the vertical middle so it doesn't
 * jitter at section edges the way a 0.5 threshold would. Topmost intersecting
 * section wins.
 */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    const visible = new Map<string, number>(); // id -> top (viewport coords)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }
        if (visible.size === 0) return;
        // Topmost of the currently-intersecting sections, in DOM order as tiebreak.
        let best = '';
        let bestTop = Infinity;
        for (const id of ids) {
          if (visible.has(id)) {
            const top = visible.get(id)!;
            if (top < bestTop) {
              bestTop = top;
              best = id;
            }
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );

    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids]);

  return active;
}
