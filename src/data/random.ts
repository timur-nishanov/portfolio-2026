import { assets } from './assets';

export type RandomMedia =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; poster?: string; alt: string };

export type RandomItem = {
  id: string;
  title: string;
  period: string;
  /** Columns of the 12-column grid the card spans on desktop. */
  span: 4 | 6 | 8;
  /** Card box, as `w / h`. Rows share a height, so a 6+6 row, a 4+4+4 row and
      an 8+4 row each need ratios that agree: 8/7 twins, squares, 2:1 + square. */
  ratio: string;
  /** Empty for now — Timur drops the clips and stills in himself. */
  media: RandomMedia | null;
};

// Nine placeholders on the site grid: 6+6, 4+4+4, 8+4, 4+8 — every row lands
// on twelve. Media is null until the real files arrive; a couple carry
// existing stills so the expand-to-modal can be seen working meanwhile.
export const random: RandomItem[] = [
  { id: 'rnd-artem', title: 'Artemartem.com', period: '2025–2026', span: 6, ratio: '8 / 7', media: null },
  { id: 'rnd-stepicon', title: 'Stepicon', period: '2026', span: 6, ratio: '8 / 7', media: { type: 'image', src: assets.randomStepicon, alt: 'stepicon2026 conference site' } },
  { id: 'rnd-smartbot', title: 'Smartbot concept', period: '2024', span: 4, ratio: '1 / 1', media: { type: 'image', src: assets.randomSmartbot, alt: 'Chatbot constructor landing' } },
  { id: 'rnd-mobile', title: 'Mobile concepts', period: '2025', span: 4, ratio: '1 / 1', media: null },
  { id: 'rnd-moneta', title: 'Moneta fintech', period: '2026', span: 4, ratio: '1 / 1', media: null },
  { id: 'rnd-posters', title: 'Posters', period: '2023–2025', span: 8, ratio: '2 / 1', media: { type: 'image', src: assets.randomSoyun, alt: 'Soyun — Verbal musica poster' } },
  { id: 'rnd-watch', title: 'Apple Watch concept', period: '2024', span: 4, ratio: '1 / 1', media: { type: 'image', src: assets.randomAppleWatch, alt: 'Apple Watch concept' } },
  { id: 'rnd-wallet', title: 'Ever Wallet', period: '2024', span: 4, ratio: '1 / 1', media: null },
  { id: 'rnd-rides', title: 'Rides app', period: '2025', span: 8, ratio: '2 / 1', media: null },
];
