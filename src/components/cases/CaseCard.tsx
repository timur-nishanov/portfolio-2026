'use client';

import { useEffect, useRef } from 'react';
import type { Case } from '@/data/cases';
import { lerp, q } from '@/lib/lerp';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MagneticButton } from '@/components/header/MagneticButton';
import { MediaSlot } from './MediaSlot';
import { FloatingLogo } from './FloatingLogo';

// Dialled back from the first pass — still reads as the plate adjusting to the
// cursor, without the lurch. Ceiling stays well under the 2.5° cap (TZ §9.3).
const MAX_TILT = 1.8; // deg
const TILT_LERP = 0.12;
const GLARE_RADIUS = 320;
const GLARE_MAX = 0.28;
const MEDIA_X = 18; // px inner-parallax amplitude (media lags the card)
const MEDIA_Y = 11;
const RETURN = '600ms cubic-bezier(0.22, 1, 0.36, 1)';

export function CaseCard({ data }: { data: Case }) {
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

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
      card.style.transition = '';
      media.style.transition = '';
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
      {/* Regular weight per Figma — 40px / 120%, no medium. */}
      <h3 className="t-case-title text-ink">
        <span className="block">{data.titleLine1}</span>
        <span className="block">{data.titleLine2}</span>
      </h3>
      <p className="t-body mt-[clamp(16px,2vw,29px)] max-w-[512px] text-ink-muted">
        {data.description}
      </p>
      <div className="mt-[clamp(20px,3vw,44px)] flex flex-wrap gap-[clamp(8px,1.1vw,16px)]">
        {data.links.map((link) => {
          const isSoon = link.label === 'TESTFLIGHT SOON';
          return (
            <MagneticButton
              key={link.label}
              as="a"
              href={link.href}
              magnetic={!isSoon}
              disabled={isSoon}
              className="glass rounded-full"
              labelClassName={`pixel ${isSoon ? 'text-ink-muted' : 'text-ink'}`}
              style={{ width: 'var(--btn-w)', height: 'var(--btn-h)' }}
            >
              {link.label}
            </MagneticButton>
          );
        })}
      </div>
    </div>
  );

  const MediaBlock = (
    <div className="relative z-10 flex items-center justify-center">
      <div ref={mediaRef} className="w-full will-change-transform">
        <MediaSlot media={data.media} />
      </div>
    </div>
  );

  // Columns are not 50/50 — the Figma gives the text 512 and the media 650,
  // with a 78 gap. Mirrored for the text-right cards.
  const gridCols = textFirst
    ? 'md:grid-cols-[512fr_650fr]'
    : 'md:grid-cols-[650fr_512fr]';

  return (
    <div ref={rootRef} style={{ perspective: '1200px' }}>
      {/* Card box is the Figma 1400x763 proportion; aspect-ratio yields to
          content, so nothing can be clipped at awkward breakpoints. */}
      <div
        ref={cardRef}
        className={`relative grid grid-cols-1 items-center gap-[clamp(24px,5.57vw,78px)] rounded-card bg-surface px-[clamp(20px,5.71vw,80px)] py-[clamp(28px,4vw,54px)] will-change-transform md:aspect-[1400/763] ${gridCols}`}
      >
        {/* Logo is positioned against the card box — its %s come from the
            Figma, including the deliberate bleed past the top edge. */}
        {data.logo ? <FloatingLogo logo={data.logo} trackRef={cardRef} /> : null}

        {/* Glare — soft-light, above content, non-interactive (TZ §9.3). */}
        <div
          ref={glareRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-card opacity-0 transition-opacity duration-300 [mix-blend-mode:soft-light]"
        />
        {/* DOM order matches the visual order, so no `order` overrides are
            needed and the column sizes always line up with their content. */}
        {textFirst ? (
          <>
            <div className="relative z-10">{TextBlock}</div>
            {MediaBlock}
          </>
        ) : (
          <>
            {MediaBlock}
            <div className="relative z-10">{TextBlock}</div>
          </>
        )}
      </div>
    </div>
  );
}
