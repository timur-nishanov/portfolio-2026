import { assets } from './assets';
import type { CaseSlot } from './caseSlot';

/** The media in the Yandex Cloud case study (YandexCloudArticle): see
    CaseSlot. What each stand-in waits for is noted with it. */
type YandexCloudMedia = {
  /** 01: the booth at Yandex Scale 2026, the game on its 55-inch screen.
      To come: the best photo from the conference, the booth and the screen
      with the game in it. */
  booth: CaseSlot;
  /** 01: "Build it yourself". To come: a 10–15 s recording: one service
      dragged into a slot, a second placed with two taps, one slot wrong, so
      the result shows green and red chips. */
  buildYourself: CaseSlot;
  /** 02: the task wheel, in the iMac: the loop the home page's card plays. */
  wheel: CaseSlot;
  /** 03: "Choose from ready-made". To come: a 6–8 s recording from the
      prototype: a tap on the best bundle, the "Great choice!" result, the
      points banner and the QR card sliding in on the right. */
  readyBundle: CaseSlot;
  /** Where it landed: people from Yandex playing it on the touchscreen.
      To come: a 15–25 s loop, no sound. Check the faces may be shown; if not,
      a second photo of the booth instead. */
  team: CaseSlot;
};

export const yandexCloudMedia: YandexCloudMedia = {
  booth: { kind: 'image', alt: 'The Yandex Cloud booth at Yandex Scale 2026, with the game on a 55-inch touchscreen' },
  buildYourself: {
    kind: 'video',
    alt: 'Build it yourself: a service dragged into a slot, another placed with two taps, then the result marked slot by slot',
  },
  wheel: {
    kind: 'video',
    src: assets.ycCaseVideo,
    poster: assets.ycCasePoster,
    alt: 'The task wheel sweeping through the cards and snapping to one',
  },
  readyBundle: {
    kind: 'video',
    alt: 'Choose from ready-made: a tap on a bundle, then the result with points and a QR code on the right',
  },
  team: { kind: 'video', alt: 'Yandex team members playing the game on the touchscreen' },
};
