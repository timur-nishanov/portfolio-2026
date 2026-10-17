import type { CaseSlot } from './caseSlot';

/** The media in the Yandex Cloud case study (YandexCloudArticle): see
    CaseSlot. The recordings are each the whole of their white stage, the
    game's screen at 1280×800, as the Chums case's are; the booth's photo and
    the clip of the game being played stand upright, at 4:5. */
type YandexCloudMedia = {
  /** Opening: the first screen, the choice of mode, the task wheel and a
      task opened. */
  firstScreen: CaseSlot;
  /** 01: the booth at Yandex Scale 2026, the game on its screen. */
  booth: CaseSlot;
  /** 01: "Build it yourself": services into the slots, the result marked
      slot by slot. */
  buildYourself: CaseSlot;
  /** 01: the two minutes running out, and the right order shown. */
  timesUp: CaseSlot;
  /** 02: the task wheel: the loop the home page's card plays in its iMac,
      set on the stage as the recordings are. */
  wheel: CaseSlot;
  /** 03: "Choose from ready-made": the best bundle, the points, the QR code. */
  readyBundle: CaseSlot;
  /** 03: from a "Build it yourself" result to the short mode in one tap. */
  goToReady: CaseSlot;
  /** Where it landed: the game played on the touchscreen. */
  team: CaseSlot;
};

/** A recording in /cases/yandex-cloud, its poster its first frame. */
const clip = (name: string, w: number, h: number, alt: string, caption: string): CaseSlot => ({
  kind: 'video',
  src: `/cases/yandex-cloud/${name}.mp4`,
  poster: `/cases/yandex-cloud/${name}.webp`,
  w,
  h,
  alt,
  caption,
});

export const yandexCloudMedia: YandexCloudMedia = {
  firstScreen: clip(
    '01-first-screen',
    1280,
    800,
    'The first screen, the choice between building it yourself and a ready bundle, the task wheel, and a task opened',
    'From the first screen to a task',
  ),
  booth: {
    kind: 'image',
    src: '/cases/yandex-cloud/02-booth.webp',
    w: 960,
    h: 1200,
    alt: 'The Yandex Cloud data platform booth at Yandex Scale 2026, a visitor playing the game on its touchscreen',
    caption: 'The booth at Yandex Scale 2026',
  },
  buildYourself: clip(
    '03-build-yourself',
    1280,
    800,
    'Build it yourself: two services put into the slots, then the result with the wrong one marked and the right order',
    'Building the chain yourself',
  ),
  timesUp: clip(
    '04-times-up',
    1280,
    800,
    'The timer running out on a task, then “Time’s up!” with the right order for it',
    'When the two minutes run out',
  ),
  wheel: clip('05-wheel', 1280, 800, 'The task wheel sweeping through the cards and snapping to one', 'The task wheel'),
  readyBundle: clip(
    '06-ready-bundle',
    1280,
    800,
    'Choose from ready-made: a tap on the best of three bundles, then “Great choice!”, the points banner and the QR code',
    'Picking a ready bundle',
  ),
  goToReady: clip(
    '07-go-to-ready',
    1280,
    800,
    'A Build it yourself result, then “Go” leading to the ready-made mode and a task with three bundles',
    'From a result to the short mode in one tap',
  ),
  team: clip(
    '08-team',
    720,
    900,
    'The game played on the touchscreen: a mode, a task, the services and the result',
    'The Yandex team playing',
  ),
};
