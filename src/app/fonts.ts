import localFont from 'next/font/local';

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
});

// 5by7 — pixel font, menu items + button labels only, always uppercase.
export const pixel = localFont({
  src: [{ path: './fonts/5by7.ttf', weight: '400', style: 'normal' }],
  variable: '--font-pixel',
  display: 'swap',
});
