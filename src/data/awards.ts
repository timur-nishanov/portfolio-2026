export type Award = {
  id: string;
  title: string;
  /** Small caption under the title — the awarding platform. */
  source: string;
  tier: 'gold' | 'teal'; // laurel colour
  href: string | null;
};

// Titles verbatim from the reference. Order is reading order (row by row).
export const awards: Award[] = [
  {
    id: 'awwwards-sotd',
    title: 'Awwwards Site of the Day',
    source: 'AWWWARDS.COM',
    tier: 'gold',
    href: 'https://www.awwwards.com/',
  },
  {
    id: 'cssda-sotd',
    title: 'CSSDA Site of the Day',
    source: 'CSSDESIGNAWARDS.COM',
    tier: 'gold',
    href: 'https://www.cssdesignawards.com/',
  },
  {
    id: 'fwa-sotd',
    title: 'FWA Site of the Day',
    source: 'THEFWA.COM',
    tier: 'gold',
    href: 'https://thefwa.com/',
  },
  {
    id: 'muzli-picks',
    title: 'Muzli Picks',
    source: 'MUZ.LI',
    tier: 'teal',
    href: 'https://muz.li/',
  },
  {
    id: 'minimal-gallery',
    title: 'Minimal Gallery picks',
    source: 'MINIMAL.GALLERY',
    tier: 'teal',
    href: 'https://minimal.gallery/',
  },
  {
    id: 'awwwards-portfolio-hero',
    title: 'Awwwards Portfolio Hero nominee',
    source: 'AWWWARDS.COM',
    tier: 'teal',
    href: 'https://www.awwwards.com/',
  },
];
