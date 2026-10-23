// The Random block after the awards (RandomCollage), after the work list on
// rsquare.work: a big clip per project, set left or right of centre, its
// title underneath.

export type CollageItem = {
  id: string;
  title: string;
  /** Which side of the page the clip leans to. An upright clip is set
   *  narrower, so it fits the screen's height, and further in. */
  side: 'left' | 'right';
  video: {
    src: string;
    poster: string;
    width: number;
    height: number;
    alt: string;
    /** On a phone, a shape of its own (CSS aspect ratio), the clip cropped at
     *  its sides to fill it: an iMac render has grey to spare either side of
     *  the device, and at a phone's width the iMac came out small. */
    phoneAspect?: string;
  };
};

// Sides alternate down the page, and the upright clips sit between wide ones.
// Every clip but the first (the app in hand, filmed) is a render on a warm
// grey with a vignette; those backgrounds are brought to the case cards'
// #e6e6e7, flat, the devices' shadows kept and the devices left as they were.
// A new render goes the same way (scripts/recolor-random.py), or its
// background shows warmer.
export const collage: CollageItem[] = [
  {
    id: 'kritika',
    title: 'Kritika, a film review app I’m building in SwiftUI',
    side: 'left',
    video: {
      src: '/random/kritika.mp4', // C0418.mp4, unsqueezed to 1400×978, no audio
      poster: '/random/kritika.webp',
      width: 1400,
      height: 978,
      alt: 'Kritika on an iPhone: a film page with its ratings',
    },
  },
  {
    id: 'artem',
    title: 'Artem Shcherbakov’s site',
    side: 'right',
    video: {
      src: '/random/artem-site.mp4', // artem_404_1600x1200_60.mp4, 1600×1200 (4:3), 60fps, no audio
      poster: '/random/artem-site.webp',
      width: 1600,
      height: 1200,
      alt: 'The artemartemartem.com 404 page in a browser: “page not found” inks in, and cut-out heads trail the cursor across it',
    },
  },
  {
    id: 'opus-experiment',
    title: 'Quick experiment with Opus 5.5',
    side: 'left',
    video: {
      src: '/random/opus-experiment.mp4', // D4OzCiDYGSrnN6HD.mp4, 960×1200 (4:5), 60fps, no audio
      poster: '/random/opus-experiment.webp',
      width: 960,
      height: 1200,
      alt: 'A reward screen on an iPhone: hold to unlock, and a chrome drop bursts into a star',
    },
  },
  {
    id: 'stepicon',
    title: 'Stepicon 2026: the conference landing page, from concept to code',
    side: 'right',
    video: {
      src: '/random/stepicon-site.mp4', // stepicon_mockup_1080p60.mp4, 1600×900, 60fps, no audio
      poster: '/random/stepicon-site.webp',
      width: 1600,
      height: 900,
      alt: 'The Stepicon 2026 site on an iMac: the conference for people who build learning products',
      // The iMac spans x 247–1355 of 1600 from 52px down: at 4:3 the crop
      // keeps 200–1400, as much grey either side of it as above.
      phoneAspect: '4 / 3',
    },
  },
  {
    id: 'kritika-review',
    title: 'Adding a review in Kritika: poster in, stamp out',
    side: 'left',
    video: {
      src: '/random/kritika-review.mp4', // BtJr5050gdQcQBWs.mp4, 960×1200 (4:5), 60fps, no audio
      poster: '/random/kritika-review.webp',
      width: 960,
      height: 1200,
      alt: 'Kritika: picking a poster, typing the film title and rating the plot, acting and action',
    },
  },
  {
    id: 'moneta',
    title: 'Moneta, a payment platform: home page and journal concepts',
    side: 'right',
    video: {
      src: '/random/moneta-site.mp4', // moneta_mockup_1080p60_1.mp4, 1600×900, 60fps, no audio
      poster: '/random/moneta-site.webp',
      width: 1600,
      height: 900,
      alt: 'The Moneta site on an iMac: online payments and settlements, and its journal',
      phoneAspect: '4 / 3', // the same iMac, placed as Stepicon's
    },
  },
];
