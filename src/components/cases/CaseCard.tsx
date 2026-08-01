'use client';

import { useRef } from 'react';
import type { Case } from '@/data/cases';
import { MagneticButton } from '@/components/header/MagneticButton';
import { MediaSlot } from './MediaSlot';
import { FloatingLogo } from './FloatingLogo';

export function CaseCard({ data }: { data: Case }) {
  // Kept only as the scroll-parallax track for the floating logo — the card
  // itself no longer tilts/glares on hover (that read as too much; only the
  // buttons keep their magnet).
  const cardRef = useRef<HTMLDivElement>(null);

  const textFirst = data.layout === 'text-left';

  const TextBlock = (
    <div className="flex flex-col justify-center">
      {/* Regular weight per Figma — 40px / 120%, no medium. */}
      <h3 className="t-case-title text-ink">
        <span className="block">{data.titleLine1}</span>
        <span className="block">{data.titleLine2}</span>
      </h3>
      {/* Fixed rhythm per Timur: 16px title→copy, 52px copy→buttons. */}
      <p className="t-body mt-[16px] max-w-[512px] text-ink-muted">
        {data.description}
      </p>
      <div className="mt-[52px] flex flex-wrap gap-[clamp(8px,1.1vw,16px)]">
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

  // A bleeding mockup eats the card's side padding so it reaches the card edge
  // and is clipped there (MediaSlot already clips), reading bigger and half-off
  // the card. The negative margin mirrors the card's own px clamp.
  const bleedClass =
    data.media.bleed === 'right'
      ? 'md:mr-[calc(-1*clamp(20px,5.71vw,80px))]'
      : data.media.bleed === 'left'
        ? 'md:ml-[calc(-1*clamp(20px,5.71vw,80px))]'
        : '';

  // wideMedia scales the mockup up on desktop, anchored to the card side it
  // bleeds toward (so it grows into the column gap, not over the copy). md-only
  // via Tailwind utilities — a raw transform would also scale on mobile, where
  // the single-column media is full width and would overflow into a scrollbar.
  const scaleClass = data.wideMedia
    ? data.media.bleed === 'right'
      ? 'md:origin-right md:scale-[1.06]'
      : 'md:origin-left md:scale-[1.06]'
    : '';

  const MediaBlock = (
    <div className={`relative z-10 flex items-center justify-center ${bleedClass}`}>
      <div className={`w-full ${scaleClass}`}>
        <MediaSlot media={data.media} />
      </div>
    </div>
  );

  // Columns are not 50/50 — the Figma gives the text 512 and the media 650,
  // with a 78 gap. Mirrored for the text-right cards. wideMedia trades a little
  // text width (kept above the title's ~465px minimum) for a bigger mockup.
  const gridCols = data.wideMedia
    ? textFirst
      ? 'md:grid-cols-[minmax(0,480fr)_minmax(0,682fr)]'
      : 'md:grid-cols-[minmax(0,682fr)_minmax(0,480fr)]'
    : textFirst
      ? 'md:grid-cols-[512fr_650fr]'
      : 'md:grid-cols-[650fr_512fr]';

  return (
    <div
      ref={cardRef}
      className={`relative grid grid-cols-1 items-center gap-[clamp(24px,5.57vw,78px)] rounded-card bg-surface px-[clamp(20px,5.71vw,80px)] py-[clamp(28px,4vw,54px)] md:aspect-[1400/763] ${gridCols}`}
    >
      {/* Logo is positioned against the card box — its %s come from the Figma,
          including the deliberate bleed past the top edge. */}
      {data.logo ? <FloatingLogo logo={data.logo} trackRef={cardRef} /> : null}

      {/* DOM order matches the visual order, so no `order` overrides are needed
          and the column sizes always line up with their content. */}
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
  );
}
