export type Award = {
  id: string;
  title: string;
  /** Small caption under the title — where the award came from. */
  source: string;
  tier: 'gold' | 'teal'; // laurel colour is data, not index-derived (TZ §10)
  href: string | null;
};

// TODO(copy): `source` currently names the platform that gave the award. In the
// reference layout this line is the *awarded site's* domain instead — swap these
// for the project URLs if that's the intent.
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
    id: 'find-design-2025',
    title: '1st place on design-shots platform find.design 2025',
    source: 'FIND.DESIGN',
    tier: 'gold',
    href: 'https://find.design/',
  },
  {
    id: 'muzli-picks',
    title: 'Muzli Picks',
    source: 'MUZ.LI',
    tier: 'teal',
    href: 'https://muz.li/',
  },
  {
    id: 'awwwards-portfolio-hero',
    title: 'Awwwards Portfolio Hero nominee',
    source: 'AWWWARDS.COM',
    tier: 'teal',
    href: 'https://www.awwwards.com/',
  },
  {
    id: 'awwwards-honorable',
    title: 'Awwwards Honorable\nMention',
    source: 'AWWWARDS.COM',
    tier: 'teal',
    href: 'https://www.awwwards.com/',
  },
];
