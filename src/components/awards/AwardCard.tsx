'use client';

import { useRef } from 'react';
import type { Award } from '@/data/awards';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMagnetic } from '@/hooks/useMagnetic';
import { Laurels } from './Laurels';

// Same feel as the buttons, just a touch softer — the card is a much bigger
// box, so an identical pull would read as the whole grid sliding around.
const LAUREL_PULL = 0.1;
const LAUREL_MAX = 10;
const TEXT_PULL = 0.055;
const TEXT_MAX = 5;

/** Award: laurels, title, and the source line under it. Magnetic on hover. */
export function AwardCard({ award }: { award: Award }) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const laurelRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();

  useMagnetic(
    rootRef,
    [
      { ref: laurelRef, factor: LAUREL_PULL, max: LAUREL_MAX },
      { ref: textRef, factor: TEXT_PULL, max: TEXT_MAX },
    ],
    canHover && !reduced,
  );

  return (
    <a
      ref={rootRef}
      href={award.href ?? undefined}
      target={award.href ? '_blank' : undefined}
      rel={award.href ? 'noopener noreferrer' : undefined}
      className="group flex flex-col items-center px-4 text-center no-underline"
    >
      <span ref={laurelRef} className="block will-change-transform">
        <Laurels tier={award.tier} />
      </span>
      <span ref={textRef} className="block will-change-transform">
        {/* whitespace-pre-line honours the explicit \n in a title (drops
            "Mention" onto its own line); others still wrap by width. */}
        <span className="t-case-title mt-[clamp(20px,3.3vw,48px)] block max-w-[22ch] whitespace-pre-line text-ink">
          {award.title}
        </span>
        {/* No size override — takes `.pixel`'s own scale, same as the buttons. */}
        <span className="pixel mt-[clamp(10px,1.1vw,16px)] block tracking-pixel text-ink-muted">
          {award.source}
        </span>
      </span>
    </a>
  );
}
