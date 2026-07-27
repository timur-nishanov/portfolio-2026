'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { CaseLogo } from '@/data/cases';
import { q } from '@/lib/lerp';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { useIsMobile } from '@/hooks/useMediaQuery';

/**
 * Big case logo that drifts on scroll (TZ §8). Driven by the single Lenis rAF
 * loop, not a per-element scroll listener. Distinct coefficient per logo; the
 * translate is proportional to how far the card centre sits from the viewport
 * centre, so the logo lags the card and reads as depth. pointer-events: none.
 */
export function FloatingLogo({ logo, trackRef }: { logo: CaseLogo; trackRef: React.RefObject<HTMLElement | null> }) {
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
      { rootMargin: '20% 0px 20% 0px' },
    );
    io.observe(track);

    const onFrame = () => {
      if (!inView.current) return;
      const rect = track.getBoundingClientRect();
      const centerDelta = rect.top + rect.height / 2 - window.innerHeight / 2;
      const y = -centerDelta * logo.parallax;
      el.style.transform = `translate3d(0, ${q(y)}px, 0)`;
    };
    const unregister = register(onFrame);

    return () => {
      io.disconnect();
      unregister();
    };
  }, [register, logo.parallax, trackRef, isMobile]);

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 select-none ${logo.position}`}
    >
      <Image src={logo.src} alt="" width={240} height={240} className="h-auto w-full" />
    </div>
  );
}
