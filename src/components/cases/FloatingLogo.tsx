'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { CaseLogo } from '@/data/cases';
import { clamp, easeInOut, q } from '@/lib/lerp';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useIsMobile } from '@/hooks/useMediaQuery';

/**
 * Big case logo that drifts on scroll (TZ §8). Driven by the single Lenis rAF
 * loop, not a per-element scroll listener.
 *
 * Travel is normalised: `progress` runs -1..1 across the card's transit through
 * the viewport and scales a small per-logo px amplitude, so each logo stays in
 * its own case's neighbourhood. Direction differs per logo (see cases.ts) —
 * matching vectors read as one flat sheet sliding, not depth.
 */
export function FloatingLogo({
  logo,
  trackRef,
}: {
  logo: CaseLogo;
  trackRef: React.RefObject<HTMLElement | null>;
}) {
  const { register } = useSmoothScroll();
  const isMobile = useIsMobile();
  const elRef = useRef<HTMLDivElement>(null);
  const inView = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    const track = trackRef.current;
    if (!el || !track || isMobile) return;

    // will-change only while the card is on screen (TZ §8).
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
        el.style.willChange = entry.isIntersecting ? 'transform' : 'auto';
      },
      { rootMargin: '25% 0px 25% 0px' },
    );
    io.observe(track);

    const onFrame = () => {
      if (!inView.current) return;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const span = vh / 2 + rect.height / 2;
      // -1 when the card sits below the fold, +1 once it has passed above it.
      const progress = clamp((vh / 2 - (rect.top + rect.height / 2)) / span, -1, 1);
      // Eased rather than linear — the drift settles in and out instead of
      // sliding at a constant rate.
      const eased = easeInOut(progress);
      const { x, y, rot } = logo.drift;
      el.style.transform = `translate3d(${q(eased * x)}px, ${q(eased * y)}px, 0) rotate(${q(
        eased * rot,
      )}deg)`;
    };
    const unregister = register(onFrame);

    return () => {
      io.disconnect();
      unregister();
    };
  }, [register, logo.drift, trackRef, isMobile]);

  // Mobile cards are narrow enough that the logo just overlaps the copy —
  // drop it there entirely (TODO: a mobile-specific placement later).
  if (isMobile) return null;

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      className="pointer-events-none absolute z-20 select-none"
      style={{ left: `${logo.x}%`, top: `${logo.y}%`, width: `${logo.w}%` }}
    >
      <Image src={logo.src} alt="" width={590} height={590} className="h-auto w-full" />
    </div>
  );
}
