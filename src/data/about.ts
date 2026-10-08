// The "about me" block after the cases (AboutAwards): two paragraphs pinned in
// place while the award diplomas slide up over them one by one.

export const aboutText = [
  'Experienced mostly in B2C, fintech and Web3. Focused on visuals and complex user flows. Skilled in research, vibe coding, and AI generation.',
  'I love to mix craft and systems. Always trying to keep interfaces and concepts balanced between emotion and usability. But I still prefer a bit more craft :)',
];

export type AwardPoster = {
  id: string;
  src: string;
  /** Intrinsic size of the file, so the box is reserved before it loads. */
  width: number;
  height: number;
  alt: string;
  /** Tilt (deg) and sideways nudge (px) in the stack. Fixed, not random: the
   *  server and the browser must render the same values. */
  tilt: number;
  nudge: number;
};

// Stack order, bottom to top: Awwwards first.
export const awardPosters: AwardPoster[] = [
  {
    id: 'awwwards-sotd',
    src: '/awards/posters/awwwards-sotd.webp',
    width: 728,
    height: 966,
    alt: 'Awwwards Site of the Day, July 25, 2026',
    tilt: -2,
    nudge: -10,
  },
  {
    id: 'fwa-otd',
    src: '/awards/posters/fwa-otd.webp',
    width: 728,
    height: 1030,
    alt: 'FWA of the Day, August 30, 2026',
    tilt: 1.5,
    nudge: 9,
  },
  {
    id: 'cssda-wotd',
    src: '/awards/posters/cssda-wotd.webp',
    width: 728,
    height: 1028,
    alt: 'CSS Design Awards Website of the Day, June 17, 2026',
    tilt: -1,
    nudge: -6,
  },
  {
    id: 'cssda-ui',
    src: '/awards/posters/cssda-ui.webp',
    width: 728,
    height: 1028,
    alt: 'CSS Design Awards UI Design, June 17, 2026',
    tilt: 2.5,
    nudge: 12,
  },
  {
    id: 'cssda-ux',
    src: '/awards/posters/cssda-ux.webp',
    width: 728,
    height: 1028,
    alt: 'CSS Design Awards UX Design, June 17, 2026',
    tilt: -1.5,
    nudge: -8,
  },
  {
    id: 'cssda-innovation',
    src: '/awards/posters/cssda-innovation.webp',
    width: 728,
    height: 1028,
    alt: 'CSS Design Awards Innovation, June 17, 2026',
    tilt: 1,
    nudge: 5,
  },
];
