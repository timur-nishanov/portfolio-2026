export type RandomMedia =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; poster?: string; alt: string };

export type RandomItem = {
  id: string;
  title: string;
  period: string;
  /** Card box, as `w / h`. The two columns flow independently (see
      RandomSection), so heights are free to vary — that variety is the point. */
  ratio: string;
  /** Empty for now — Timur drops the clips and stills in himself. */
  media: RandomMedia | null;
};

// Nine cards, two to a row, the right column set lower than the left so the
// eye walks down a staircase. Odd entries land in the left column, even in
// the right. All plates for now: no media until the real files arrive.
export const random: RandomItem[] = [
  { id: 'rnd-artem', title: 'Artemartem.com', period: '2025–2026', ratio: '8 / 7', media: null },
  { id: 'rnd-stepicon', title: 'Stepicon', period: '2026', ratio: '4 / 5', media: null },
  { id: 'rnd-smartbot', title: 'Smartbot concept', period: '2024', ratio: '1 / 1', media: null },
  { id: 'rnd-mobile', title: 'Mobile concepts', period: '2025', ratio: '8 / 7', media: null },
  { id: 'rnd-moneta', title: 'Moneta fintech', period: '2026', ratio: '4 / 5', media: null },
  { id: 'rnd-posters', title: 'Posters', period: '2023–2025', ratio: '1 / 1', media: null },
  { id: 'rnd-watch', title: 'Apple Watch concept', period: '2024', ratio: '8 / 7', media: null },
  { id: 'rnd-wallet', title: 'Ever Wallet', period: '2024', ratio: '4 / 5', media: null },
  { id: 'rnd-rides', title: 'Rides app', period: '2025', ratio: '1 / 1', media: null },
];
