import localFont from 'next/font/local';

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

// SF Pro Text — the first screen (title, tagline, menu). Self-hosted from the
// client's files (subset to Latin + Cyrillic + punctuation, woff2), so it
// renders the same everywhere instead of falling back off Apple devices.
export const sfpro = localFont({
  src: [
    { path: './fonts/SFProText-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/SFProText-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/SFProText-Semibold.woff2', weight: '600', style: 'normal' },
    { path: './fonts/SFProText-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sfpro',
  display: 'swap',
});
