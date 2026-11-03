// The "about me" block after the cases (AboutAwards): three paragraphs, then the
// award diplomas coming up over them one by one.

// A line of a paragraph: plain text, or a link (shown grey, like the case
// subtitles).
export type AboutLine = string | { text: string; href: string };

// A paragraph, line by line; `phone`, the same words set again for a phone,
// where its own lines don't fit (AboutAwards shows one or the other).
export type AboutParagraph = { lines: AboutLine[]; phone?: AboutLine[] };

const artemSite: AboutLine = { text: 'artemartemartem.com', href: 'https://artemartemartem.com' };

// Each paragraph set line by line, broken where the sense breaks, and no two
// lines one after the other of a like length: two of them, as long as each
// other, read as a block. The first and the last open on a long line and go
// on in two shorter ones, short then longer (the last with the address under
// them); the short one between, short then long, turns from one to the other.
// The list of what goes into the work (research, prototypes, front ends, 3D,
// motion) is gone: the first screen says "who builds in code", and Random
// shows the rest. At a phone's 15px the first two keep their lines; the
// last opens on a line too long for a phone, and is set again there.
export const aboutText: AboutParagraph[] = [
  {
    lines: [
      // A word joiner after the hyphen keeps "e-commerce" whole where the
      // line wraps (a narrow phone): the browser would break after it, and
      // the face has no non-breaking hyphen.
      'Mostly B2C: fintech, Web3 and e-\u2060commerce.',
      'I like messy flows',
      'and making them look good.',
    ],
  },
  {
    // The turn, on its second line.
    lines: ['I care about systems,', 'but I still prefer a bit more craft.'],
  },
  {
    // The site, the awards, the address. On a phone, short and long in turn.
    lines: [
      'I designed a site for film director Artem\u00a0Shcherbakov.',
      'It got Site\u00a0of\u00a0the\u00a0Day',
      'on Awwwards, FWA and CSSDA.',
      artemSite,
    ],
    phone: [
      'I designed a site',
      'for film director Artem\u00a0Shcherbakov.',
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
