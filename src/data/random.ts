export type RandomMedia =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; poster?: string; alt: string };

export type RandomItem = {
  id: string;
  title: string;
  period: string;
  /** The pill on the caption row — the sphere of the piece (Site, Concept…). */
  tag: string;
  /** Card box, as `w / h`. One ratio for the whole grid, so the rows line up. */
  ratio: string;
  /** Empty for now — Timur drops the clips and stills in himself. */
  media: RandomMedia | null;
};

// Nine cards on a 3×3 grid (see RandomSection), all 4:3 like the
// madewithjitter.com tiles. All plates for now: no media until the files
// arrive.
export const random: RandomItem[] = [
  { id: 'rnd-artem', title: 'Artemartem.com', period: '2025–2026', tag: 'Site', ratio: '4 / 3', media: null },
  { id: 'rnd-stepicon', title: 'Stepicon', period: '2026', tag: 'Site', ratio: '4 / 3', media: null },
  { id: 'rnd-smartbot', title: 'Smartbot concept', period: '2024', tag: 'Concept', ratio: '4 / 3', media: null },
  { id: 'rnd-mobile', title: 'Mobile concepts', period: '2025', tag: 'Concept', ratio: '4 / 3', media: null },
  { id: 'rnd-moneta', title: 'Moneta fintech', period: '2026', tag: 'Product', ratio: '4 / 3', media: null },
  { id: 'rnd-posters', title: 'Posters', period: '2023–2025', tag: 'Graphic', ratio: '4 / 3', media: null },
  { id: 'rnd-watch', title: 'Apple Watch concept', period: '2024', tag: 'Concept', ratio: '4 / 3', media: null },
  { id: 'rnd-wallet', title: 'Ever Wallet', period: '2024', tag: 'Product', ratio: '4 / 3', media: null },
  { id: 'rnd-rides', title: 'Rides app', period: '2025', tag: 'Product', ratio: '4 / 3', media: null },
];
