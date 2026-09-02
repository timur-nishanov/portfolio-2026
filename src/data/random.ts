export type RandomMedia =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; poster?: string; alt: string };

export type RandomItem = {
  id: string;
  title: string;
  period: string;
  /** Card box, as `w / h`. Wide, like a still from a reel — the files that
      will land here are clips. */
  ratio: string;
  /** Empty for now — Timur drops the clips and stills in himself. */
  media: RandomMedia | null;
};

// Nine wide cards in one flow, alternating left and right down the page
// (see RandomSection). All plates for now: no media until the files arrive.
export const random: RandomItem[] = [
  { id: 'rnd-artem', title: 'Artemartem.com', period: '2025–2026', ratio: '16 / 9', media: null },
  { id: 'rnd-stepicon', title: 'Stepicon', period: '2026', ratio: '16 / 9', media: null },
  { id: 'rnd-smartbot', title: 'Smartbot concept', period: '2024', ratio: '16 / 9', media: null },
  { id: 'rnd-mobile', title: 'Mobile concepts', period: '2025', ratio: '16 / 9', media: null },
  { id: 'rnd-moneta', title: 'Moneta fintech', period: '2026', ratio: '16 / 9', media: null },
  { id: 'rnd-posters', title: 'Posters', period: '2023–2025', ratio: '16 / 9', media: null },
  { id: 'rnd-watch', title: 'Apple Watch concept', period: '2024', ratio: '16 / 9', media: null },
  { id: 'rnd-wallet', title: 'Ever Wallet', period: '2024', ratio: '16 / 9', media: null },
  { id: 'rnd-rides', title: 'Rides app', period: '2025', ratio: '16 / 9', media: null },
];
