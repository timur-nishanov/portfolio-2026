'use client';

import { animate, useMotionValue } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { nav, type NavItem as NavItemData } from '@/data/nav';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { ScrambleText, type ScrambleHandle } from './ScrambleText';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useMagnetic } from '@/hooks/useMagnetic';
import { zoomOf } from '@/lib/zoom';

const PILL_SPRING = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 1 };

// Gentler than the buttons — the items sit side by side, so a big pull would
// make neighbours collide visually.
const LABEL_PULL = 0.09;
const LABEL_MAX = 5;

type ItemProps = {
  item: NavItemData;
  isActive: boolean;
  onSelect: (id: string) => void;
  registerRef: (el: HTMLButtonElement | null) => void;
};

function NavItem({ item, isActive, onSelect, registerRef }: ItemProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const scrambleRef = useRef<ScrambleHandle>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();

  // Magnet moves the label only. The button box stays put so the FLIP puck's
  // getBoundingClientRect measurement can't be poisoned by the transform.
  useMagnetic(rootRef, [{ ref: labelRef, factor: LABEL_PULL, max: LABEL_MAX }], canHover && !reduced);

  return (
    <button
      ref={(el) => {
        rootRef.current = el;
        registerRef(el);
      }}
      type="button"
      onClick={() => onSelect(item.id)}
      onPointerEnter={() => scrambleRef.current?.play()}
      onFocus={() => scrambleRef.current?.play()}
      aria-current={isActive ? 'true' : undefined}
      style={{ width: 'var(--nav-item-w)', height: 'var(--nav-item-h)' }}
      className="relative inline-flex shrink-0 items-center justify-center"
    >
      <span ref={labelRef} className="will-change-transform">
        <ScrambleText
          ref={scrambleRef}
          text={item.label}
          active={isActive}
          className={`pixel block transition-colors duration-200 ${
            isActive ? 'text-ink' : 'text-ink-muted'
          }`}
        />
      </span>
    </button>
  );
}

type Props = {
  activeId: string;
  onSelect: (id: string) => void;
};

/**
 * Navigation pill with a FLIP puck (TZ §5.1). Items are a fixed width per the
 * Figma (140x64 at 1440, no gap, 8px container padding), so the puck lands on
 * clean multiples — but it still measures rather than computing, so a font swap
 * or a resize can't desync it. Springs x + width; never a CSS left transition.
 */
export function NavPill({ activeId, onSelect }: Props) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const x = useMotionValue(0);
  const width = useMotionValue(0);
  const ready = useRef(false);

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
    // Rects are visual px; the puck's transform/width are written in local px,
    // which the desktop zoom then scales — divide it out or the puck lands
    // short and 80% wide.
    const z = zoomOf(container);
    const targetX = (iRect.left - cRect.left) / z;
    const targetW = iRect.width / z;

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
    <GlassSurface style={{ padding: 'var(--nav-pad)' }}>
      <div ref={containerRef} className="relative flex items-center">
        <div
          ref={puckRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 h-full rounded-full bg-white shadow-[0_2px_24px_rgba(0,0,0,0.10)]"
        />
        <ul className="relative flex items-center">
          {nav.map((item, i) => (
            <li key={item.id} className="flex">
              <NavItem
                item={item}
                isActive={item.id === activeId}
                onSelect={onSelect}
                registerRef={(el) => {
                  itemRefs.current[i] = el;
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </GlassSurface>
  );
}
