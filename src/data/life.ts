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
      'A site for Artem Shcherbakov, designed and delivered to dev by me and Roma Rodionov from Cedro, won SOTD on Awwwards. First SOTD for studio btw',
    date: 'JULY 2026',
    media: { type: 'image', src: '/life/awwwards-poster.jpg', alt: 'Awwwards Site of the Day' },
  },
  {
    id: 'life-postcards',
    title: "Postcard series for my girlfriend's photo project",
    description:
      'I designed a set around her photos of Thailand, turning locations into art prints. We printed at a local typography, ended up as souvenirs',
    date: 'FEBRUARY 2026',
    media: {
      type: 'video',
      src: '/life/postcards.webm',
      poster: '/life/postcards-poster.jpg',
      alt: 'Postcard series prints',
    },
  },
  {
    id: 'life-talk',
    title: 'Talk on AI in the design process',
    description:
      "Presented at our team sync on how I've folded AI into my design workflow and daily life — people from other streams joined the call to watch",
    date: 'MARCH 2026',
    media: { type: 'image', src: '/life/claude-poster.png', alt: 'Talk on AI in the design process' },
  },
  {
    id: 'life-find-design',
    title: 'Top Ranked Designer on Find.Design',
    description:
      'Started posting shots and quickly landed several Shot of the Day picks. Climbed to #1 on the rankings in about a week',
    date: 'DECEMBER 2025',
    media: { type: 'image', src: '/life/top-rank.png', alt: 'Find.Design top ranked designers' },
  },
  {
    id: 'life-film-app',
    title: 'Building a film app',
    description:
      "Because a photo archive that stays buried under folders isn't an archive. Building something to hold and sort what I actually watch",
    date: 'FEBRUARY 2026',
    media: { type: 'image', src: '/life/chimera-poster.jpg', alt: 'La chimera — film app concept' },
  },
  {
    id: 'life-figma-motion',
    title: 'Implement Figma Motion in some workflows',
    description:
      'I use it for handoff and quick prototypes now, so a spec no longer needs a separate deck. Fast, everyday practice',
    date: 'JANUARY 2026',
    media: { type: 'image', src: '/life/figmotion-poster.png', alt: 'Figma Motion timeline' },
  },
  {
    id: 'life-growth-form',
    title: 'Finished to read On Growth And Form by D’Arcy Thompson',
    description:
      'On how form follows the forces acting on it. Changed the way I look at proportion and structure in what I design',
    date: 'NOVEMBER 2025',
    media: { type: 'image', src: '/life/growth-poster.jpg', alt: 'On Growth and Form' },
  },
];
