// The Random block after the awards (RandomCollage), after the work list on
// rsquare.work: a big clip per project, set left or right of centre, its
// title underneath, and a still or two from the same project laid over its
// edges.

export type CollageShot = {
  src: string;
  width: number;
  height: number;
  /** Box over the clip, in % of the clip's width (x, w) and height (y); may
   *  stick out past its edges. `m*` are the same on a phone, kept inside the
   *  screen. */
  x: number;
  y: number;
  w: number;
  mx: number;
  my: number;
  mw: number;
  /** How far it drifts against the clip as the block scrolls past (px). */
  drift: number;
};

export type CollageItem = {
  id: string;
  title: string;
  /** Which side of the page the clip leans to. */
  side: 'left' | 'right';
  video: { src: string; poster: string; width: number; height: number; alt: string };
  shots: CollageShot[];
};

export const collage: CollageItem[] = [
  {
    id: 'artem',
    title: 'Site for director Artem Shcherbakov',
    side: 'left',
    video: {
      src: '/random/artem-site.mp4', // Shcherbakov_Video.mp4, 1600×900, no audio
      poster: '/random/artem-site.webp',
      width: 1600,
      height: 900,
      alt: 'The artemartemartem.com site on a laptop and an iPad',
    },
    shots: [
      // "Represented by Catalyzm" screen, over the top right corner.
      {
        src: '/random/artem-catalyzm.webp',
        width: 720,
        height: 480,
        x: 76,
        y: -16,
        w: 34,
        mx: 62,
        my: -14,
        mw: 40,
        drift: -56,
      },
      // The works page on the iPad, over the bottom right (clear of the
      // title on a phone).
      {
        src: '/random/artem-ipad.webp',
        width: 720,
        height: 535,
        x: 58,
        y: 74,
        w: 24,
        mx: 64,
        my: 50,
        mw: 30,
        drift: 40,
      },
    ],
  },
  {
    id: 'kritika',
    title: 'Kritika, a film review app I built in Swift',
    side: 'right',
    video: {
      src: '/random/kritika.mp4', // C0418.mp4, unsqueezed to 1400×978, no audio
      poster: '/random/kritika.webp',
      width: 1400,
      height: 978,
      alt: 'Kritika on an iPhone: a film page with its ratings',
    },
    shots: [
      // The film page up close, over the top left corner.
      {
        src: '/random/kritika-chimera.webp',
        width: 600,
        height: 750,
        x: -11,
        y: -12,
        w: 22,
        mx: 2,
        my: -14,
        mw: 30,
        drift: -48,
      },
    ],
  },
];
