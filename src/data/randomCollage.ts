// The Random block after the awards (RandomCollage), after the work list on
// rsquare.work: a big clip per project, set left or right of centre, its
// title underneath.

export type CollageItem = {
  id: string;
  title: string;
  /** Which side of the page the clip leans to. An upright clip is set
   *  narrower, so it fits the screen's height, and further in. */
  side: 'left' | 'right';
  video: { src: string; poster: string; width: number; height: number; alt: string };
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
];
