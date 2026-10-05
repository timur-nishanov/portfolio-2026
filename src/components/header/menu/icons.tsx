/**
 * Line glyphs for the header menu, redrawn from the mockup at its exact pixel
 * size (no icon font, no extra requests). All stroke `currentColor`, so the row
 * colour drives them.
 */
type Props = { className?: string };

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** The 9×5 chevron inside the round menu button. Drawn pointing up; the
    button holds a down and an up copy and crossfades between them (menu.css)
    — a 9px chevron turning through its side reads as a glyph glitch. */
export function ButtonChevron({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className={className}>
      <path d="M2.5 7.6 6 4.1l3.5 3.5" strokeWidth="1.5" {...stroke} />
    </svg>
  );
}

/** Row disclosure chevron, 5×10 in a 16px slot (matches the copy icon slot). */
export function RowChevron({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={className}>
      <path d="m5.9 3.3 4.6 4.7-4.6 4.7" strokeWidth="1.5" {...stroke} />
    </svg>
  );
}

/** Two overlapping rounded squares; the back one is only its visible L so
    the front square reads as lying on top without needing a fill. */
export function CopyGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={className}>
      <rect x="1.2" y="5.3" width="9.5" height="9.5" rx="2.3" strokeWidth="1.4" {...stroke} />
      <path
        d="M5.3 5.3V3.5a2.3 2.3 0 0 1 2.3-2.3h4.9a2.3 2.3 0 0 1 2.3 2.3v4.9a2.3 2.3 0 0 1-2.3 2.3h-1.8"
        strokeWidth="1.4"
        {...stroke}
      />
    </svg>
  );
}

export function CheckGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" className={className}>
      <path d="m3.4 8.4 3.2 3.1 6-7" strokeWidth="1.6" {...stroke} />
    </svg>
  );
}
