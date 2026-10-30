// The "about me" block after the cases (AboutAwards): three paragraphs, then the
// award diplomas coming up over them one by one.

// A line of a paragraph: plain text, or a link (shown grey, like the case
// subtitles).
export type AboutLine = string | { text: string; href: string };

// A paragraph, line by line; `phone`, the same words set again for a phone,
// in shorter lines (AboutAwards shows one or the other).
export type AboutParagraph = { lines: AboutLine[]; phone?: AboutLine[] };

const artemSite: AboutLine = { text: 'artemartemartem.com', href: 'https://artemartemartem.com' };

// Each paragraph set line by line, broken where the sense breaks: on a
// laptop the lines of a like length; on a phone in short lines, a short one
// and a longer one by turns, none of them long enough to wrap there.
export const aboutText: AboutParagraph[] = [
  {
    lines: [
      'Mostly B2C: fintech, Web3 and e-commerce.',
      'I like messy flows and making them look good.',
      'I research, prototype and build front ends,',
      'and make 3D, icons, motion and video with AI.',
    ],
    phone: [
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
    // A pause between the two longer ones, the turn on its second line.
    lines: ['I care about systems,', 'but I still prefer a bit more craft.'],
    phone: ['I care about systems,', 'but I still prefer', 'a bit more craft.'],
  },
  {
    // The site, the awards, the address.
    lines: [
      'I designed a site for film director Artem\u00a0Shcherbakov.',
      'It got Site\u00a0of\u00a0the\u00a0Day on Awwwards, FWA and CSSDA.',
      artemSite,
    ],
    phone: [
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
