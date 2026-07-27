'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { nav } from '@/data/nav';
import { site } from '@/data/site';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useHideOnScroll } from '@/hooks/useScrollDirection';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { NavPill } from './NavPill';
import { CopyMailButton } from './CopyMailButton';
import { MagneticButton } from './MagneticButton';

const NAV_IDS = nav.map((n) => n.id);

export function Header() {
  const { scrollTo } = useSmoothScroll();
  const observed = useActiveSection(NAV_IDS);
  const [active, setActive] = useState(NAV_IDS[0]);
  // Hover lives in a ref, not state: re-rendering the header on mouseenter
  // would re-render the nav items and interrupt the scramble mid-flight.
  const hoveredRef = useRef(false);
  const hidden = useHideOnScroll(hoveredRef);
  const lockUntil = useRef(0);

  // Observer drives the active item, except briefly after a click so the pill
  // doesn't flicker through intermediate sections during the smooth scroll.
  useEffect(() => {
    if (performance.now() > lockUntil.current) setActive(observed);
  }, [observed]);

  const onSelect = useCallback(
    (id: string) => {
      setActive(id);
      lockUntil.current = performance.now() + 1200;
      scrollTo(`#${id}`, { offset: -100, duration: 1.1 });
    },
    [scrollTo],
  );

  return (
    <header
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{
        top: 'var(--header-top)',
        // Hide by lifting the whole thing (its own height + the top offset +
        // a buffer) past the top edge, so its bottom clears y=0 at any height —
        // -140% could leave a sliver on taller/wrapped headers.
        transform: hidden
          ? 'translateY(calc(-100% - var(--header-top) - 24px))'
          : 'translateY(0)',
        transition: 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      {/* Wraps below ~630px: the pill keeps the first row and the two buttons
          drop to a second one, rather than running off the screen. */}
      <nav
        className="flex flex-wrap items-center justify-center"
        style={{ gap: 'var(--header-gap)' }}
        aria-label="Primary"
      >
        <NavPill activeId={active} onSelect={onSelect} />
        <CopyMailButton />
        <MagneticButton
          as="a"
          href={site.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-solid rounded-full"
          labelClassName="pixel text-white"
          style={{ width: 'var(--btn-w)', height: 'var(--btn-h)' }}
        >
          TELEGRAM
        </MagneticButton>
      </nav>
    </header>
  );
}
