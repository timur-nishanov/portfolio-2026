'use client';

import { useEffect, useRef } from 'react';
import type { Case } from '@/data/cases';
import { lerp, q } from '@/lib/lerp';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MagneticButton } from '@/components/header/MagneticButton';
import { MediaSlot } from './MediaSlot';
import { FloatingLogo } from './FloatingLogo';

const MAX_TILT = 2.5; // deg — more than this reads as a cheap 2014 tilt.js (TZ §9.3)
const TILT_LERP = 0.12;
const GLARE_RADIUS = 320;
const GLARE_MAX = 0.35;
const MEDIA_X = 26; // px inner-parallax amplitude (media lags the card)
const MEDIA_Y = 16;
const RETURN = '600ms cubic-bezier(0.22, 1, 0.36, 1)';

export function CaseCard({ data }: { data: Case }) {
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null); // stable box for logo parallax

  useEffect(() => {
    if (!canHover || reduced) return;
    const root = rootRef.current;
    const card = cardRef.current;
    const glare = glareRef.current;
    const media = mediaRef.current;
    if (!root || !card || !glare || !media) return;

    let hovering = false;
    let raf = 0;
    let px = 0; // -1..1
    let py = 0;
    let curRX = 0;
    let curRY = 0;
    let curMX = 0;
    let curMY = 0;

    const clearTransition = () => {
      card.style.transition = '';
      media.style.transition = '';
    };

    const loop = () => {
      curRX = lerp(curRX, -py * MAX_TILT, TILT_LERP);
      curRY = lerp(curRY, px * MAX_TILT, TILT_LERP);
      curMX = lerp(curMX, px * MEDIA_X, TILT_LERP);
      curMY = lerp(curMY, py * MEDIA_Y, TILT_LERP);
      card.style.transform = `rotateX(${q(curRX)}deg) rotateY(${q(curRY)}deg)`;
      media.style.transform = `translate3d(${q(curMX)}px, ${q(curMY)}px, 0)`;
      if (hovering) raf = requestAnimationFrame(loop);
    };

    const onEnter = () => {
      hovering = true;
      clearTransition();
      glare.style.opacity = String(GLARE_MAX);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const lx = e.clientX - r.left;
      const ly = e.clientY - r.top;
      px = (lx / r.width) * 2 - 1;
      py = (ly / r.height) * 2 - 1;
      glare.style.background = `radial-gradient(${GLARE_RADIUS}px circle at ${lx}px ${ly}px, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)`;
    };

    const onLeave = () => {
      hovering = false;
      cancelAnimationFrame(raf);
      // Ease back — a spring looks nervous on the return (TZ §9.3).
      card.style.transition = `transform ${RETURN}`;
      media.style.transition = `transform ${RETURN}`;
      card.style.transform = 'rotateX(0deg) rotateY(0deg)';
      media.style.transform = 'translate3d(0,0,0)';
      curRX = curRY = curMX = curMY = 0;
      glare.style.opacity = '0';
    };

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [canHover, reduced]);

  const textFirst = data.layout === 'text-left';

  const TextBlock = (
    <div className="flex flex-col justify-center">
      <h3 className="font-hoves text-[clamp(26px,3vw,34px)] font-medium leading-[1.12] text-ink">
        <span className="block">{data.titleLine1}</span>
        <span className="block">{data.titleLine2}</span>
      </h3>
      <p className="mt-5 max-w-[30rem] font-hoves text-[15px] leading-[1.5] text-ink-muted">
        {data.description}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {data.links.map((link) => {
          const inactive = link.href === null;
          const isSoon = link.label === 'TESTFLIGHT SOON';
          return (
            <MagneticButton
              key={link.label}
              as="a"
              href={link.href}
              magnetic={!isSoon}
              disabled={isSoon}
              className="glass rounded-full"
              labelClassName={`pixel px-6 py-3.5 text-[12px] ${
                isSoon ? 'text-ink-muted' : 'text-ink'
              }`}
            >
              {link.label}
            </MagneticButton>
          );
        })}
      </div>
    </div>
  );

  const MediaBlock = (
    <div ref={trackRef} className="relative">
      {data.logo ? <FloatingLogo logo={data.logo} trackRef={trackRef} /> : null}
      <div ref={mediaRef} className="will-change-transform">
        <MediaSlot media={data.media} />
      </div>
    </div>
  );

  return (
    <div ref={rootRef} style={{ perspective: '1200px' }} className="[transform-style:preserve-3d]">
      <div
        ref={cardRef}
        className="relative grid grid-cols-1 gap-8 overflow-visible rounded-card bg-surface p-8 will-change-transform md:grid-cols-2 md:gap-10 md:p-12"
      >
        {/* Glare — soft-light, above content, non-interactive (TZ §9.3). */}
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-card opacity-0 transition-opacity duration-300 [mix-blend-mode:soft-light]"
        />
        {textFirst ? (
          <>
            {TextBlock}
            {MediaBlock}
          </>
        ) : (
          <>
            <div className="md:order-2">{TextBlock}</div>
            <div className="md:order-1">{MediaBlock}</div>
          </>
        )}
      </div>
    </div>
  );
}
