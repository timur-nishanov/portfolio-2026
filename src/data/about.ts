// The "about me" block after the cases (AboutAwards): three paragraphs, then the
// award diplomas coming up over them one by one.

// A line of a paragraph: plain text, or a link (shown grey, like the case
// subtitles).
export type AboutLine = string | { text: string; href: string };

// A paragraph, line by line.
export type AboutParagraph = { lines: AboutLine[] };

const artemSite: AboutLine = { text: 'artemartemartem.com', href: 'https://artemartemartem.com' };

// Each paragraph set line by line, in short lines broken where the sense
// breaks, a short one and a longer one by turns, centred: none of them is
// long enough to wrap on a phone.
export const aboutText: AboutParagraph[] = [
  {
    lines: [
      'Mostly B2C: fintech,',
      'Web3 and e-commerce.',
      'I like messy flows',
      'and making them look good.',
      'I research, prototype',
      'and build front ends,',
      'and make 3D, icons,',
      'motion and video with AI.',
    ],
  },
  {
    // The turn on its second line.
    lines: ['I care about systems,', 'but I still prefer', 'a bit more craft.'],
  },
  {
    // The site, the awards, the address.
    lines: [
      'I designed a site',
      'for film director',
      'Artem\u00a0Shcherbakov.',
      'It got Site\u00a0of\u00a0the\u00a0Day',
      'on Awwwards, FWA and CSSDA.',
      artemSite,
    ],
  },
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
