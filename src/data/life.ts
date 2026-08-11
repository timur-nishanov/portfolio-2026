export type LifeEntry = {
  id: string;
  title: string;
  description: string;
  date: string;
  media: {
    type: 'image' | 'video';
    src: string;
    poster?: string;
    alt: string;
  };
};

// Order matches the Figma column. The media slot is a fixed 386×512 (portrait)
// per the macket — the poster fills it (object-cover), no rounding.
// TODO(copy): titles/dates are read off the reference; confirm exact wording.
export const life: LifeEntry[] = [
  {
    id: 'life-awwwards',
    title: 'Awwwards Site of the Day',
    description:
      'A site for Artem Shcherbakov, designed and handed off by Roma Rodionov and me at Cedro, won Awwwards Site of the Day. It was the studio’s first SOTD, by the way.',
    date: 'JULY 2026',
    media: { type: 'image', src: '/life/awwwards-poster.webp', alt: 'Awwwards Site of the Day' },
  },
  {
    id: 'life-talk',
    title: 'Talk on AI in the design process',
    description:
      'I gave a team talk on how I use AI in my design workflow and daily life. People from other teams joined the call too.',
    date: 'MARCH 2026',
    media: { type: 'image', src: '/life/claude-poster.png', alt: 'Talk on AI in the design process' },
  },
  {
    id: 'life-postcards',
    title: "Postcard series for my girlfriend's photo project",
    description:
      'I designed a series around her photos from Thailand, turning the locations into art prints. We had them made at a local print shop and kept them as souvenirs.',
    date: 'FEBRUARY 2026',
    media: {
      type: 'video',
      src: '/life/postcards.webm',
      poster: '/life/postcards-poster.webp',
      alt: 'Postcard series prints',
    },
  },
  {
    id: 'life-figma-motion',
    title: 'Adding Figma Motion to my workflow',
    description:
      'I now use it for handoff and quick prototypes, so a spec no longer needs a separate deck. It is fast enough for everyday work.',
    date: 'JANUARY 2026',
    media: { type: 'image', src: '/life/figmotion-poster.webp', alt: 'Figma Motion timeline' },
  },
  {
    id: 'life-find-design',
    title: 'Top Ranked Designer on Find.Design',
    description:
      'I started posting shots and soon earned several Shot of the Day picks. I reached #1 in the rankings in about a week.',
    date: 'DECEMBER 2025',
    media: { type: 'image', src: '/life/top-rank.webp', alt: 'Find.Design top ranked designers' },
  },
  {
    id: 'life-film-app',
    title: 'Started a cinema club',
    description:
      'There are only two of us for now: my girlfriend and me. We make presentations about films, directors, and movements in cinema. We are happy to welcome new members.',
    date: 'NOVEMBER 2025',
    media: { type: 'image', src: '/life/chimera-poster.webp', alt: 'La chimera — film app concept' },
  },
  {
    id: 'life-growth-form',
    title: 'Finished reading On Growth and Form by D’Arcy Thompson',
    description:
      'It explores how form follows the forces acting on it. The book changed how I look at proportion and structure in my work.',
    date: 'NOVEMBER 2025',
    media: { type: 'image', src: '/life/growth-poster.webp', alt: 'On Growth and Form' },
  },
];
