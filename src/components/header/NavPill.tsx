'use client';

import { animate, useMotionValue } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { nav } from '@/data/nav';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScrambleText, type ScrambleHandle } from './ScrambleText';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const PILL_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 1 };

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

/**
 * Navigation pill with a FLIP puck (TZ §5.1). The white puck measures the
 * active item's box relative to the container and springs x + width — never a
 * CSS left transition. Recomputed on resize and after fonts load, otherwise it
 * lands on fallback-font metrics and jumps on the first frame.
 */
export function NavPill({ activeId, onSelect }: Props) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrambleRefs = useRef<(ScrambleHandle | null)[]>([]);
  const x = useMotionValue(0);
  const width = useMotionValue(0);
  const ready = useRef(false);

  // Keep the puck's DOM in sync with the motion values (transform + width only).
  useEffect(() => {
    const el = puckRef.current;
    if (!el) return;
    const write = () => {
      el.style.transform = `translateX(${x.get()}px)`;
      el.style.width = `${width.get()}px`;
    };
    write();
    const unsubX = x.on('change', write);
    const unsubW = width.on('change', write);
    return () => {
      unsubX();
      unsubW();
    };
  }, [x, width]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const idx = nav.findIndex((n) => n.id === activeId);
    const item = itemRefs.current[idx];
    if (!container || !item) return;
    const cRect = container.getBoundingClientRect();
    const iRect = item.getBoundingClientRect();
    const targetX = iRect.left - cRect.left;
    const targetW = iRect.width;

    if (!ready.current || reduced) {
      x.set(targetX);
      width.set(targetW);
      ready.current = true;
    } else {
      animate(x, targetX, PILL_SPRING);
      animate(width, targetW, PILL_SPRING);
    }
  }, [activeId, reduced, x, width]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    let cancelled = false;
    // Pixel-font metrics differ from the fallback — re-measure once fonts load.
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);

  return (
    <GlassSurface className="px-1.5 py-1.5">
      <div ref={containerRef} className="relative flex items-center">
        <div
          ref={puckRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-full rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        />
        <ul className="relative flex items-center">
          {nav.map((item, i) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  onPointerEnter={() => scrambleRefs.current[i]?.play()}
                  onFocus={() => scrambleRefs.current[i]?.play()}
                  aria-current={isActive ? 'true' : undefined}
                  className={`pixel relative px-4 py-2 text-[12px] leading-none transition-colors duration-200 ${
                    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <ScrambleText
                    ref={(h) => {
                      scrambleRefs.current[i] = h;
                    }}
                    text={item.label}
                    active={isActive}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </GlassSurface>
  );
}
