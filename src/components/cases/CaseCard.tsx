'use client';

import { useRef } from 'react';
import type { Case } from '@/data/cases';
import { CaseLinks } from './CaseLinks';
import { MediaSlot } from './MediaSlot';
import { FloatingLogo } from './FloatingLogo';

export function CaseCard({ data }: { data: Case }) {
  // Kept only as the scroll-parallax track for the floating logo — the card
  // itself no longer tilts/glares on hover (that read as too much; only the
  // buttons keep their magnet).
  const cardRef = useRef<HTMLDivElement>(null);

  const textFirst = data.layout === 'text-left';

  // Rhythm per Timur: the column keeps 100px from the card's top and bottom
  // edges (it pads the difference over the card's own inset), the title sits
  // 28 above the copy, sections are 20 apart with 8 between label and body,
  // and the space down to the links is whatever is left over.
  const TextBlock = (
    <div
      className="flex flex-col justify-between md:h-full"
      style={{ paddingBlock: 'max(0px, calc(var(--case-text-y) - var(--case-pad-y)))' }}
    >
      <div>
        {/* Regular weight per Figma — 40px / 120%, no medium. */}
        <h3 className="t-case-title text-ink">
          <span className="block">{data.titleLine1}</span>
          <span className="block">{data.titleLine2}</span>
        </h3>
        <div className="mt-[28px] flex flex-col gap-[20px]">
          {data.sections.map((section) => (
            <div key={section.label}>
              <p className="t-case-label">{section.label}</p>
              <p className="t-case-copy mt-[8px]">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[56px] md:mt-0">
        <CaseLinks links={data.links} />
      </div>
    </div>
  );

  // A bleeding mockup eats the card's side padding so it reaches the card edge
  // and is clipped there (MediaSlot already clips), reading bigger and half-off
  // the card. The negative margin mirrors the card's own px clamp.
  // The left-bleeding mockup (the Lendly laptop) is pushed a further step past
  // the card edge so the body sits well outside it, not just flush.
  const bleedClass =
    data.media.bleed === 'right'
      ? 'md:mr-[calc(-1*clamp(20px,5.71vw,80px))]'
      : data.media.bleed === 'left'
        ? 'md:ml-[calc(-1*clamp(20px,5.71vw,80px)-clamp(16px,4vw,60px))]'
        : '';

  // Scale is per-case data now. A bleeding mockup is anchored to the edge it
  // bleeds toward so it grows into the column gap rather than over the copy;
  // one that sits inside the card scales about its own centre.
  const mediaScale = data.mediaScale ?? (data.wideMedia && data.media.bleed ? 1.06 : 1);
  const mediaOrigin = data.media.bleed === 'right' ? 'right' : data.media.bleed === 'left' ? 'left' : 'center';

  const MediaBlock = (
    <div className={`relative z-10 flex items-center justify-center ${bleedClass}`}>
      <div
        className="media-scale w-full"
        style={
          { '--media-scale': mediaScale, '--media-origin': mediaOrigin } as React.CSSProperties
        }
      >
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
      className={`relative grid grid-cols-1 items-center gap-[clamp(24px,5.57vw,78px)] md:items-stretch rounded-card bg-surface px-[clamp(20px,5.71vw,80px)] py-[var(--case-pad-y)] md:aspect-[1400/763] ${gridCols}`}
    >
      {/* Logo is positioned against the card box — its %s come from the Figma,
          including the deliberate bleed past the top edge. */}
      {data.logo ? <FloatingLogo logo={data.logo} trackRef={cardRef} /> : null}

      {/* DOM order matches the visual order, so no `order` overrides are needed
          and the column sizes always line up with their content. */}
      {textFirst ? (
        <>
          <div className="relative z-10 md:h-full">{TextBlock}</div>
          {MediaBlock}
        </>
      ) : (
        <>
          {MediaBlock}
          <div className="relative z-10 md:h-full">{TextBlock}</div>
        </>
      )}
    </div>
  );
}
