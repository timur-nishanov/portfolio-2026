// The "about me" block after the cases (AboutAwards): three paragraphs, then the
// award diplomas coming up over them one by one.

// A line of a paragraph: plain text, or a link (shown grey, like the case
// subtitles).
export type AboutLine = string | { text: string; href: string };

// Each paragraph set line by line, broken where the sense breaks, the lines
// of a like length. On a phone a line breaks again at its '\n' (a space
// elsewhere), into lines about half as long, set by hand as well.
export const aboutText: AboutLine[][] = [
  [
    // A word joiner after the hyphen keeps "e-commerce" whole where the
    // line wraps, as the outro keeps "part-time" (outro.ts).
    'Mostly B2C: fintech,\nWeb3 and e-\u2060commerce.',
    'I like messy flows\nand making them look good.',
    'I research, prototype\nand build front ends,',
    'and make 3D, icons,\nmotion and video with AI.',
  ],
  [
    // A pause between the two longer ones, the turn on its second line.
    'I care about systems,',
    'but I still prefer a bit more craft.',
  ],
  [
    // The two lines the old block had: the site, the awards.
    'I designed a site for film director\nArtem\u00a0Shcherbakov.',
    'It got Site\u00a0of\u00a0the\u00a0Day\non Awwwards, FWA and CSSDA.',
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
