// The "about me" block after the cases (AboutAwards): three paragraphs, then the
// award diplomas coming up over them one by one.

// A line of a paragraph: plain text, or a link (shown grey, like the case
// subtitles).
export type AboutLine = string | { text: string; href: string };

// Each paragraph runs on as one line of text, set in the column's width and
// evened out there (about.css), so it comes out as a block of lines of a like
// width; the link has a line of its own. No-break spaces keep a name or a
// phrase whole ("Site of the Day", "Artem Shcherbakov", "front ends"), keep
// "I" and "a" off a line's end and the last two words together; a word joiner
// after the hyphen keeps "e-commerce" whole, as the outro keeps "part-time"
// (outro.ts).
export const aboutText: AboutLine[][] = [
  [
    'Mostly B2C: fintech, Web3 and e-\u2060commerce. I\u00a0like the messy flows: payments and onboarding, and I\u00a0like them to look good. I\u00a0research, prototype and build front\u00a0ends, and make 3D, icons, motion and video with\u00a0AI.',
  ],
  [
    'I\u00a0care about systems, but I\u00a0still prefer a\u00a0bit more craft: a\u00a0poster that peels off like a\u00a0stamp, a\u00a0timer that shows the answer instead of telling you that you\u00a0lost.',
  ],
  [
    'With the Salt\u00a0and\u00a0Pepper team, I\u00a0made the concept and every screen of a\u00a0site for film\u00a0director Artem\u00a0Shcherbakov. It got Site\u00a0of\u00a0the\u00a0Day on Awwwards, FWA and\u00a0CSSDA.',
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
