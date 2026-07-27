export type Award = {
  id: string;
  title: string;
  description: string;
  tier: 'gold' | 'teal'; // laurel colour is data, not index-derived (TZ §10)
  href: string | null;
};

// All six descriptions are the same filler in the mockup — keep it as one
// constant so it swaps in a single place (TZ §10). TODO(copy).
export const AWARD_PLACEHOLDER =
  'It took only 7 days to hit the top. My work received the highest engagement and making me the #1 ranked designer on platform. after one year platform was closed';

export const awards: Award[] = [
  { id: 'awwwards-sotd', title: 'Awwwards Site of the Day', description: AWARD_PLACEHOLDER, tier: 'gold', href: null },
  { id: 'cssda-sotd', title: 'CSSDA Site of the Day', description: AWARD_PLACEHOLDER, tier: 'gold', href: null },
  {
    id: 'find-design-2025',
    title: '1st place on design-shots platform find.design 2025',
    description: AWARD_PLACEHOLDER,
    tier: 'gold',
    href: null,
  },
  { id: 'muzli-picks', title: 'Muzli Picks', description: AWARD_PLACEHOLDER, tier: 'teal', href: null },
  {
    id: 'awwwards-portfolio-hero',
    title: 'Awwwards Portfolio Hero nominee',
    description: AWARD_PLACEHOLDER,
    tier: 'teal',
    href: null,
  },
  { id: 'awwwards-honorable', title: 'Awwwards Honorable Mention', description: AWARD_PLACEHOLDER, tier: 'teal', href: null },
];
