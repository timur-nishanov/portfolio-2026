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
  const [hovered, setHovered] = useState(false);
  const hidden = useHideOnScroll(hovered);
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed inset-x-0 z-50 flex justify-center"
      style={{
        top: 'var(--header-top)',
        transform: hidden ? 'translateY(-140%)' : 'translateY(0)',
        transition: 'transform 400ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <nav className="flex items-center gap-3" aria-label="Primary">
        <NavPill activeId={active} onSelect={onSelect} />
        <CopyMailButton />
        <MagneticButton
          as="a"
          href={site.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-solid rounded-full"
          labelClassName="pixel px-6 py-3.5 text-[12px] text-white"
        >
          TELEGRAM
        </MagneticButton>
      </nav>
    </header>
  );
}
