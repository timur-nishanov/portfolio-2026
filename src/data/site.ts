export const site = {
  name: 'Timur Nishanov',
  // The site's own address: canonical links, the sitemap, the share cards.
  url: 'https://timurdesigner.vercel.app',
  // TODO: confirm the real contact address with Timur.
  email: 'timanemetis@gmail.com',
  linkedin: 'https://www.linkedin.com/in/timur-nishanov-3a7510428/',
  x: 'https://x.com/nem_etis',
  // The card's author on X.
  xHandle: '@nem_etis',
  github: 'https://github.com/timur-nishanov',
  hero: {
    // New first screen (Figma 2:384): the title rides the top bar, the
    // tagline sits at the bottom, two authored lines.
    title: 'Hey! I’m Timur',
    tagline: ['senior product designer in Bangkok', 'who builds in code'],
  },
  meta: {
    title: 'Timur Nishanov · Product Designer',
    description:
      'Senior product designer in Bangkok who builds in code. Projects for Yandex Cloud, Chums, Urbantiger and Lendly.',
  },
  // The card a link unfurls into (lib/metadata): the first screen, drawn
  // still, 1200×630 (public/og.png).
  og: {
    image: '/og.png',
    width: 1200,
    height: 630,
    alt: 'Hey! I’m Timur: senior product designer in Bangkok who builds in code',
  },
} as const;
