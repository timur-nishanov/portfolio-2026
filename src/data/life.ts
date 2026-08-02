export type LifeEntry = {
  id: string;
  title: string;
  description: string;
  /** Small caption, bottom of the text column. */
  date: string;
  media: {
    type: 'image' | 'video';
    src: string;
    poster?: string;
    /** Intrinsic ratio — the media is sized by height, width follows this. */
    aspect: string;
    alt: string;
  };
};

// TODO(copy): titles/dates mirror the reference layout Timur sent and match the
// assets he uploaded; the descriptions are placeholders. Swap in the real
// wording (and confirm the dates) before this goes public.
export const life: LifeEntry[] = [
  {
    id: 'life-awwwards',
    title: 'Awwwards Site of the Day',
    description:
      'A site I designed and saw through to development took Site of the Day on Awwwards — the first SOTD for the studio.',
    date: 'JULY 2026',
    media: {
      type: 'image',
      src: '/life/awwwards-poster.png',
      aspect: '772/1024',
      alt: 'Awwwards Site of the Day poster',
    },
  },
  {
    id: 'life-postcards',
    title: "Postcard series for my girlfriend's photo project",
    description:
      'I designed a set around her photos, turning locations into prints. We printed at a local typography and they ended up as souvenirs.',
    date: 'JUNE 2026',
    media: {
      type: 'video',
      src: '/life/postcards.webm',
      poster: '/life/postcards-poster.jpg',
      aspect: '1/1',
      alt: 'Postcard series prints',
    },
  },
  {
    id: 'life-talk',
    title: 'Talk on AI in the design process',
    description:
      "Presented at our team sync on how I've folded AI into my design workflow and daily life — people from other streams joined the call to watch.",
    date: 'MARCH 2026',
    media: {
      type: 'image',
      src: '/life/claude-poster.png',
      aspect: '772/1092',
      alt: 'Claude — talk on AI in the design process',
    },
  },
  {
    id: 'life-film-app',
    title: 'Building a film app',
    description:
      'Because a photo archive that stays buried under a screen of folders is not an archive. Building something to hold and sort what I actually watch.',
    date: 'FEBRUARY 2026',
    media: {
      type: 'image',
      src: '/life/chimera-poster.png',
      aspect: '772/1092',
      alt: 'La chimera poster — film app concept',
    },
  },
  {
    id: 'life-figma-motion',
    title: 'Implement Figma Motion in some workflows',
    description:
      'Started using it for handoff and quick prototypes, so a spec no longer needs a separate deck. Fast, but everyday practice.',
    date: 'JANUARY 2026',
    media: {
      type: 'image',
      src: '/life/figmotion-poster.png',
      aspect: '772/1024',
      alt: 'Figma Motion timeline',
    },
  },
  {
    id: 'life-find-design',
    title: 'Top Ranked Designer on Find.Design',
    description:
      'Started posting shots and quickly landed several Shot of the Day picks. Climbed to #1 on the rankings in about a week.',
    date: 'DECEMBER 2025',
    media: {
      type: 'image',
      src: '/life/top-rank.png',
      aspect: '938/1024',
      alt: 'Find.Design top ranked designers board',
    },
  },
  {
    id: 'life-growth-form',
    title: 'Finished to read On Growth And Form by D’Arcy Thompson',
    description:
      'On how form follows the forces acting on it. Changed the way I look at proportion and structure in what I design.',
    date: 'NOVEMBER 2025',
    media: {
      type: 'image',
      src: '/life/growth-poster.png',
      aspect: '772/1024',
      alt: 'On Growth and Form book cover',
    },
  },
];
