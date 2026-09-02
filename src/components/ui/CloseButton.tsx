'use client';

import { useRef } from 'react';
import { useMagnetic } from '@/hooks/useMagnetic';
import { useCanHover } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * The round glass close button — the case study's and the Random overlay's
 * are this one component, so they cannot drift apart. Same glass and the
 * same pull as the header's round button, but as one layer: plate and glyph
 * travel together, so the cross never drifts off the centre of its own
 * circle. Sits fixed in the top-right; keep it outside any transformed or
 * filtered ancestor, which would capture its `position: fixed`.
 */
export function CloseButton({
  onClose,
  label,
  buttonRef,
}: {
  onClose: () => void;
  /** Screen-reader name, e.g. "Close case study". */
  label: string;
  /** For callers that move focus onto it once it is on screen. */
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  // The anchor holds the fixed position and is never transformed, so the magnet
  // keeps measuring the button's resting box instead of chasing its own offset.
  const anchorRef = useRef<HTMLDivElement>(null);
  const ownRef = useRef<HTMLButtonElement>(null);
  const ref = buttonRef ?? ownRef;
  const canHover = useCanHover();
  const reduced = useReducedMotion();
  useMagnetic(anchorRef, [{ ref, factor: 0.09, max: 6 }], canHover && !reduced);

  return (
    <div ref={anchorRef} className="case-close-anchor">
      <button ref={ref} type="button" onClick={onClose} className="case-close glass will-change-transform">
        {/* One clean stroke, nothing else. The dual-stroke-plus-shadow version
            (dark hairline under a white cross) read as a dirty outline on the
            white plate. */}
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeLinecap="round">
          <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
