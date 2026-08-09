/**
 * Brand glyphs for the footer spheres — the mark alone, no badge behind it.
 *
 * Inline SVG rather than files: no extra request, and they take `currentColor`,
 * so the colour is set once where they are used. Each is drawn on a 24×24 box
 * so one size prop governs all three.
 */
type Props = { className?: string };

export function XGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

export function LinkedInGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.04H3.54V8.98H7.1v11.47ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" />
    </svg>
  );
}

export function TelegramGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M23.91 3.79 20.3 20.84c-.25 1.21-.98 1.5-1.99.94l-5.5-4.07-2.66 2.57c-.3.3-.55.55-1.13.55l.4-5.63 10.26-9.26c.45-.4-.1-.62-.69-.23L6.24 12.5.63 10.74C-.6 10.36-.62 9.5.9 8.9l21.5-8.28c1.01-.37 1.9.24 1.51 3.17Z" />
    </svg>
  );
}
