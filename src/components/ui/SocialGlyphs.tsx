/**
 * Brand marks for the footer spheres — filled badges in each platform's own
 * colours, the way they appear as app icons.
 *
 * Inline SVG rather than files: no extra requests, and the gradients Instagram
 * needs can live right here. Each is drawn on a 24×24 box so one width governs
 * all three, and each keeps its canonical badge shape (X and Instagram are
 * rounded squares, Telegram is a disc) rather than being forced into a common
 * silhouette — that is how they are recognised.
 */
type Props = { className?: string };

export function XGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="5.4" fill="#000000" />
      <path
        fill="#ffffff"
        d="M16.99 5.25h2.2l-4.81 5.5 5.66 7.49h-4.43l-3.47-4.54-3.97 4.54H5.96l5.15-5.89L5.68 5.25h4.55l3.14 4.15 3.62-4.15Zm-.78 11.67h1.22L9.1 6.48H7.79l8.42 10.44Z"
      />
    </svg>
  );
}

export function InstagramGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        {/* The warm burst sits low-left and runs yellow → orange → magenta; a
            second, cooler pass in the top-left corner is what keeps the badge
            from reading as a plain sunset. */}
        <radialGradient id="ig-warm" cx="0.32" cy="1.06" r="1.05">
          <stop offset="0" stopColor="#FFDD55" />
          <stop offset="0.1" stopColor="#FFDD55" />
          <stop offset="0.5" stopColor="#FF543E" />
          <stop offset="1" stopColor="#C837AB" />
        </radialGradient>
        <radialGradient id="ig-cool" cx="-0.05" cy="0.02" r="0.85">
          <stop offset="0" stopColor="#3771C8" />
          <stop offset="1" stopColor="#3771C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="5.4" fill="url(#ig-warm)" />
      <rect width="24" height="24" rx="5.4" fill="url(#ig-cool)" />
      {/* Camera, knocked out in white. */}
      <path
        fill="#ffffff"
        d="M12 5.85c2 0 2.24.01 3.03.04.73.04 1.13.16 1.39.26.35.14.6.3.86.56.26.26.42.51.56.86.1.26.23.66.26 1.39.04.79.04 1.03.04 3.03s-.01 2.24-.04 3.03c-.4.73-.16 1.13-.26 1.39a2.33 2.33 0 0 1-.56.86c-.26.26-.51.42-.86.56-.26.1-.66.23-1.39.26-.79.04-1.03.04-3.03.04s-2.24-.01-3.03-.04c-.73-.04-1.13-.16-1.39-.26a2.33 2.33 0 0 1-.86-.56 2.33 2.33 0 0 1-.56-.86c-.1-.26-.23-.66-.26-1.39-.04-.79-.04-1.03-.04-3.03s.01-2.24.04-3.03c.04-.73.16-1.13.26-1.39.14-.35.3-.6.56-.86.26-.26.51-.42.86-.56.26-.1.66-.23 1.39-.26.79-.04 1.03-.04 3.03-.04Zm0-1.35c-2.04 0-2.29.01-3.09.05-.8.03-1.34.16-1.82.35-.5.19-.92.45-1.34.87-.42.42-.68.84-.87 1.34-.19.48-.32 1.02-.35 1.82-.4.8-.05 1.05-.05 3.09s.01 2.29.05 3.09c.3.8.16 1.34.35 1.82.19.5.45.92.87 1.34.42.42.84.68 1.34.87.48.19 1.02.32 1.82.35.8.04 1.05.05 3.09.05s2.29-.01 3.09-.05c.8-.03 1.34-.16 1.82-.35.5-.19.92-.45 1.34-.87.42-.42.68-.84.87-1.34.19-.48.32-1.02.35-1.82.04-.8.05-1.05.05-3.09s-.01-2.29-.05-3.09c-.03-.8-.16-1.34-.35-1.82a3.68 3.68 0 0 0-.87-1.34 3.68 3.68 0 0 0-1.34-.87c-.48-.19-1.02-.32-1.82-.35-.8-.04-1.05-.05-3.09-.05Z"
      />
      <path
        fill="#ffffff"
        d="M12 8.15a3.85 3.85 0 1 0 0 7.7 3.85 3.85 0 0 0 0-7.7Zm0 6.35a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
      />
      <circle cx="16.01" cy="7.99" r="0.9" fill="#ffffff" />
    </svg>
  );
}

export function TelegramGlyph({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="tg-disc" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2AABEE" />
          <stop offset="1" stopColor="#229ED9" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill="url(#tg-disc)" />
      <path
        fill="#ffffff"
        d="M5.43 11.87c3.5-1.52 5.83-2.53 7-3.02 3.33-1.39 4.02-1.63 4.47-1.64.1 0 .32.02.47.14.12.1.15.24.17.33.02.1.04.31.02.48-.18 1.9-.97 6.500-1.37 8.62-.17.9-.5 1.2-.82 1.23-.7.07-1.23-.46-1.9-.9-1.06-.7-1.66-1.13-2.68-1.81-1.18-.79-.42-1.22.26-1.93.18-.19 3.25-2.98 3.31-3.23.01-.03 0-.15-.06-.21-.07-.06-.17-.04-.24-.02-.1.02-1.79 1.14-5.07 3.35-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.86-.44-.75-.24-1.35-.37-1.3-.79.03-.22.33-.44.9-.67Z"
      />
    </svg>
  );
}
