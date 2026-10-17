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
