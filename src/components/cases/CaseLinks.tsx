'use client';

import { useRef } from 'react';
import type { CaseLink } from '@/data/cases';
import { ScrambleText, type ScrambleHandle } from '@/components/header/ScrambleText';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Gentler than the header buttons: these sit inline in a row, so a big pull
// would drag a label across its neighbour.
const PULL = 0.11;
const MAX = 6;

function LinkItem({ link }: { link: CaseLink }) {
  const rootRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const scrambleRef = useRef<ScrambleHandle>(null);
  const canHover = useCanHover();
  const reduced = useReducedMotion();

  useMagnetic(rootRef, [{ ref: labelRef, factor: PULL, max: MAX }], canHover && !reduced);

  // Greyed only when the label says so ("TESTFLIGHT SOON"). A missing href is
  // not the signal — the real URLs are still to come and every one of these
  // would have rendered dead grey instead of the accent.
  const inactive = /\bSOON\b/.test(link.label);

  return (
    <a
      ref={rootRef}
      href={link.href ?? undefined}
      target={inactive ? undefined : '_blank'}
      rel={inactive ? undefined : 'noopener noreferrer'}
      onPointerEnter={() => scrambleRef.current?.play()}
      onFocus={() => scrambleRef.current?.play()}
      aria-disabled={inactive || undefined}
      className={`inline-flex no-underline ${inactive ? 'pointer-events-none' : ''}`}
    >
      <span ref={labelRef} className="inline-block will-change-transform">
        <ScrambleText
          ref={scrambleRef}
          text={link.label}
          className={`pixel tracking-pixel transition-colors duration-200 ${
            inactive ? 'text-ink-muted' : 'text-laurel-teal hover:text-ink'
          }`}
        />
      </span>
    </a>
  );
}

/**
 * The row of text links under a case. Same treatment as the header buttons —
 * digits scramble on hover, the label takes the magnet — but set as plain text
 * in the accent colour, separated by middots, rather than pills.
 */
export function CaseLinks({ links }: { links: CaseLink[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-[clamp(8px,0.83vw,12px)] gap-y-2">
      {links.map((link, i) => (
        <span key={link.label} className="inline-flex items-center gap-x-[clamp(8px,0.83vw,12px)]">
          {i > 0 ? (
            <span aria-hidden="true" className="pixel text-ink-muted">
              ·
            </span>
          ) : null}
          <LinkItem link={link} />
        </span>
      ))}
    </div>
  );
}
