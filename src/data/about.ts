// The "about me" block after the cases (AboutAwards): three paragraphs, then the
// award diplomas coming up over them one by one.

// A line of a paragraph: plain text, or a link (shown grey, like the case
// subtitles).
export type AboutLine = string | { text: string; href: string };

// Each paragraph set line by line, broken where the sense breaks; a line too
// long for a phone wraps within itself, evenly.
export const aboutText: AboutLine[][] = [
  [
    // A word joiner after the hyphen keeps "e-commerce" whole where the
    // line wraps (a phone), as the outro keeps "part-time" (outro.ts).
    'Mostly B2C: fintech, Web3 and e-\u2060commerce.',
    'I like the messy flows: payments and onboarding,',
    'and I like them to look good.',
    'I research, prototype and build front ends,',
    'and make 3D, icons, motion and video with AI.',
  ],
  [
    'I care about systems,',
    'but I still prefer a bit more craft:',
    'a poster that peels off like a stamp,',
    'a timer that shows the answer',
    'instead of telling you that you lost.',
  ],
  [
    'With the Salt\u00a0and\u00a0Pepper team,',
    'I made the concept and every screen',
    'of a site for film director Artem Shcherbakov.',
    'It got Site of the Day on Awwwards, FWA and CSSDA.',
    { text: 'artemartemartem.com', href: 'https://artemartemartem.com' },
  ],
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
];
