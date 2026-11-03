// The Random block after the awards (RandomCollage), after the work list on
// rsquare.work: a big clip per project, or a still (a poster), set left or
// right of centre, its title underneath.

type CollageMedia = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** On a phone, a shape of its own (CSS aspect ratio), the clip cropped at
   *  its sides to fill it: an iMac render has grey to spare either side of
   *  the device, and at a phone's width the iMac came out small. */
  phoneAspect?: string;
};

export type CollageVideo = CollageMedia & { poster: string };

export type CollageItem = {
  id: string;
  title: string;
  /** Which side of the page the clip leans to. An upright clip is set
   *  narrower, so it fits the screen's height, and further in. */
  side: 'left' | 'right';
  /** Set smaller than the others: its source is small (a 720p recording, a
   *  poster 724px wide), and at their size it comes out soft. */
  small?: boolean;
} & ({ video: CollageVideo } | { image: CollageMedia });

// Sides alternate down the page, and each wide clip is followed by two
// upright ones, zig-zagging (nine upright to five wide), so the wide ones
// lean left and right in turn. The filmed ones aside (the app in hand),
// every clip is a render on a plain background, a warm grey with a vignette
// or white; those backgrounds are brought to the case cards' #e6e6e7, flat,
// without the devices' shadows (kept, they and the vignette's banding read
// as dirt round the devices), the devices left as they were. A new render
// goes the same way (scripts/recolor-random.py), or its background shows
// warmer. Beri Zaryad's phone stands still on white, its frame almost as
// light, where the flood frayed: its stage went instead round one mask of
// the phone for the whole clip. The two posters are stills, whole as they
// were made, and set small: their files are 724px wide.
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
    id: 'design-battle',
    title: 'A design battle app: the semifinals, and a vote for who wins',
    side: 'right',
    small: true,
    video: {
      src: '/random/design-battle.mp4', // IMG_8333.MOV, 848×848 cut to 678×848 (4:5) round the phone, 25fps, no audio
      poster: '/random/design-battle.webp',
      width: 678,
      height: 848,
      alt: 'A phone on a wooden table: the semifinals of a design battle, a countdown to the final, a live duel at 128 votes and its brief; then “who wins?”, two onboarding screens swiped between, and a vote',
    },
  },
  {
    id: 'bergman-poster',
    title: 'Bergman, a poster: five of his films under the g',
    side: 'left',
    small: true,
    image: {
      src: '/random/bergman-poster.webp', // 724×1024, flat colour, kept lossless
      width: 724,
      height: 1024,
      alt: 'A red poster: a pale mask in profile with a red slit for an eye, “Bergman” set huge in a serif, and the tail of its g running into five of his films: Fanny & Alexander, Winter Light, Cries & Whispers, Höstsonaten, Skammen',
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
    id: 'beri-zaryad-take',
    title: 'Beri Zaryad, a powerbank rental: taking one where the bonus is',
    side: 'right',
    video: {
      src: '/random/beri-zaryad-take.mp4', // the case's 01-take.mp4, its white stage the cards' grey, 1080×1350 (4:5), 60fps, no audio
      poster: '/random/beri-zaryad-take.webp',
      width: 1080,
      height: 1350,
      alt: 'Beri Zaryad on an iPhone: the map with the bonus stations picked out, a station’s card with its free slots, photos and the discount, the QR scanned and the powerbank taken',
    },
  },
  {
    id: 'stepicon',
    title: 'Stepicon 2026: the conference landing page, from concept to code',
    side: 'left',
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
    side: 'right',
    video: {
      src: '/random/kritika-review.mp4', // BtJr5050gdQcQBWs.mp4, 960×1200 (4:5), 60fps, no audio
      poster: '/random/kritika-review.webp',
      width: 960,
      height: 1200,
      alt: 'Kritika: picking a poster, typing the film title and rating the plot, acting and action',
    },
  },
  {
    id: 'gig-poster',
    title: 'A gig poster: Soyun Guyn, 11 August',
    side: 'left',
    small: true,
    image: {
      src: '/random/gig-poster.webp', // 723×1024 less a light seam at its right and bottom edges
      width: 722,
      height: 1023,
      alt: 'A gig poster: a musician with a bow in red and green grain on violet, the date and the place at the top, the name Soyun Guyn, and huge warped yellow letters across the bottom, running into pink and cyan',
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
  {
    id: 'beri-zaryad-return',
    title: 'Beri Zaryad: handing it back at a bonus station, 15% off the next rent',
    side: 'left',
    video: {
      src: '/random/beri-zaryad-return.mp4', // the case's 03-return.mp4, its white stage the cards' grey, 1080×1350 (4:5), 60fps, no audio
      poster: '/random/beri-zaryad-return.webp',
      width: 1080,
      height: 1350,
      alt: 'Beri Zaryad on an iPhone: finishing the rent at a bonus station, the code, the return, five stars for the rent and the 15% discount on the next one',
    },
  },
  {
    id: 'chums-welcome',
    title: 'Chums: the welcome screen, its logo in glass',
    side: 'right',
    small: true,
    video: {
      src: '/random/chums-welcome.mp4', // rYS2LywV7Ddm7PyH.mp4, 872×720 cut to 576×720 (4:5) round the phone, 30fps, no audio
      poster: '/random/chums-welcome.webp',
      width: 576,
      height: 720,
      alt: 'The Chums welcome screen on an iPhone: the logo turning in glass over “Welcome to the safety chatting and crypto”, powered by Matrix',
    },
  },
  {
    id: 'cedro-streak',
    title: 'A 50-day streak in Cedro’s school, confetti and all',
    side: 'left',
    small: true,
    video: {
      src: '/random/cedro-streak.mp4', // OtnAIUz-faD4GdYt.mp4, 1280×720 (16:9), 30fps, no audio
      poster: '/random/cedro-streak.webp',
      width: 1280,
      height: 720,
      alt: 'Cedro’s school in a browser: “50 days in a row! Invincible!”, a mascot raising a sword, the week’s streak in flames and 7,000 CEDRO, under falling confetti',
      // The window spans x 207–1070 of 1280: at 4:3 the crop keeps 160–1120.
      phoneAspect: '4 / 3',
    },
  },
  {
    id: 'kritika-hands',
    title: 'Kritika on my phone: a review of Eraserhead, hearts and all',
    side: 'right',
    video: {
      src: '/random/kritika-hands.mp4', // IMG_8331.MP4, 1280×1280 cut to 1024×1280 (4:5) round the phone, 25fps, no audio
      poster: '/random/kritika-hands.webp',
      width: 1024,
      height: 1280,
      alt: 'Kritika on an iPhone in hand: typing in Eraserhead, picking its poster and rating the plot, the acting and the action, hearts bursting with each rating',
    },
  },
];
