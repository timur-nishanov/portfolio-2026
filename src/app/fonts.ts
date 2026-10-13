import localFont from 'next/font/local';

// Inter — the case studies, set as benji.org sets a case. The variable face
// (weight and optical size), the Latin subset only: the cases are in English.
// Preloaded: a case opens over the home page, and its text should be in its
// face from the first frame.
export const inter = localFont({
  src: [{ path: './fonts/InterVariable-latin.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-inter',
  display: 'swap',
});

// Inter's italic, the same subset, for the cases' captions under the media.
// Not preloaded: nothing on the home page is set in it, and a case's captions
// are further down than its first screen.
export const interItalic = localFont({
  src: [{ path: './fonts/InterVariable-Italic-latin.woff2', weight: '100 900', style: 'italic' }],
  variable: '--font-inter-italic',
  display: 'swap',
  preload: false,
});

// The first screen is set in SF Pro, which is a system font (Apple licence, no
// self-hosting) — it is a CSS stack, --font-sf in globals.css, not loaded here.
// The two faces below remain for the hidden sections. preload: false while
// those sections are hidden — nothing on the one-screen page uses them, and
// preloading meant ~1.3 MB of unused TTFs on first paint. Set it back to the
// default when the sections return.

// TT Hoves — headings + body (TZ §1.4). Local only, no system fallbacks.
export const hoves = localFont({
  src: [
    { path: './fonts/TTHoves-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/TTHoves-Medium.ttf', weight: '500', style: 'normal' },
    { path: './fonts/TTHoves-DemiBold.ttf', weight: '600', style: 'normal' },
    { path: './fonts/TTHoves-Bold.ttf', weight: '700', style: 'normal' },
    { path: './fonts/TTHoves-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: './fonts/TTHoves-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-hoves',
  display: 'swap',
  preload: false,
});

// 5by7 — pixel font, menu items + button labels only, always uppercase.
export const pixel = localFont({
  src: [{ path: './fonts/5by7.ttf', weight: '400', style: 'normal' }],
  variable: '--font-pixel',
  display: 'swap',
  preload: false,
});
