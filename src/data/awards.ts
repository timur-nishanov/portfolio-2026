export type Award = {
  id: string;
  title: string;
  /** Small caption under the title — the site that won these awards. */
  source: string;
  tier: 'gold' | 'teal'; // laurel colour
  href: string | null;
};

// Titles verbatim from the reference. Order is reading order (row by row).
// Every award points at artemartem.com — the site that actually won them.
export const awards: Award[] = [
  {
    id: 'awwwards-sotd',
    title: 'Awwwards Site of the Day',
    source: 'ARTEMARTEM.COM · WITH CEDRO',
    tier: 'gold',
    href: 'https://artemartem.com',
  },
  {
    id: 'cssda-sotd',
    title: 'CSSDA Site of the Day',
    source: 'ARTEMARTEM.COM · WITH CEDRO',
    tier: 'gold',
    href: 'https://artemartem.com',
  },
  {
    id: 'fwa-sotd',
    title: 'FWA Site of the Day',
    source: 'ARTEMARTEM.COM · WITH CEDRO',
    tier: 'gold',
    href: 'https://artemartem.com',
  },
  {
    id: 'muzli-picks',
    title: 'Muzli Picks',
    source: 'ARTEMARTEM.COM · WITH CEDRO',
    tier: 'teal',
    href: 'https://artemartem.com',
  },
  {
    id: 'minimal-gallery',
    title: 'Minimal Gallery Picks',
    source: 'ARTEMARTEM.COM · WITH CEDRO',
    tier: 'teal',
    href: 'https://artemartem.com',
  },
  {
    id: 'awwwards-portfolio-hero',
    title: 'Awwwards Portfolio Hero nominee',
    source: 'ARTEMARTEM.COM · WITH CEDRO',
    tier: 'teal',
    href: 'https://artemartem.com',
  },
];
