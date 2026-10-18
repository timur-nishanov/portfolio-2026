import type { CaseSlot } from './caseSlot';

/** The media in the Yandex Alice case study (AliceArticle): see CaseSlot.
    Phone recordings are the screen raw, as the lock screen one is; the Mac
    ones are the whole desktop; the ideas and the concepts are each the whole
    of their white stage. */
type AliceMedia = {
  /** 01: the brainstorm's ideas stuck on a board, and the one we chose. */
  ideas: CaseSlot;
  /** 02: five early concepts drawing together into the one we built. */
  concepts: CaseSlot;
  /** 03: the lock screen through a day: a warm-up at 8:03, the weekend at 18:36,
      the evening at 19:56, each card opening into Alice's sheet. */
  lockScreen: CaseSlot;
  /** 03: Alice opened over the home screen: the day's greeting, the cards,
      breakfast ordered. */
  morning: CaseSlot;
  /** 04: a 1:1 with the lead: the card before it, the summary after. */
  meeting: CaseSlot;
  /** 04: the mood check-in before bed. */
  evening: CaseSlot;
  /** 05: a Figma link given to Alice in a MacBook's notch, feedback back. */
  macFeedback: CaseSlot;
  /** 05: after a call, the summary comes out of the notch. */
  macSummary: CaseSlot;
  /** 06: onboarding: signing in, the avatar, the services. */
  onboarding: CaseSlot;
};

/** A recording in /cases/alice, its poster its first frame. */
const clip = (name: string, w: number, h: number, alt: string, caption: string): CaseSlot => ({
  kind: 'video',
  src: `/cases/alice/${name}.mp4`,
  poster: `/cases/alice/${name}.webp`,
  w,
  h,
  alt,
  caption,
});

export const aliceMedia: AliceMedia = {
  ideas: clip(
    '01-ideas',
    1280,
    960,
    'The brainstorm’s ideas stuck on a board one by one, then the one we chose, an assistant across all your apps, turns green',
    'The ideas we had, and the one we chose',
  ),
  concepts: clip(
    '02-concepts',
    1280,
    800,
    'Five early concepts side by side draw together into the home screen we built',
    'Five concepts into one',
  ),
  lockScreen: {
    kind: 'video',
    src: '/mockups/alice-case.mp4',
    poster: '/mockups/alice-case.webp',
    w: 780,
    h: 1688,
    alt: 'The lock screen through a day: a warm-up after a short night at 8:03, the weekend planned at 18:36, ideas for the evening at 19:56, each card opening into Alice’s sheet',
    caption: 'Cards on the lock screen',
  },
  morning: clip(
    '03-morning',
    600,
    1300,
    'Alice opened from the home screen: the day’s greeting, the cards for the day, and breakfast ordered in one tap',
    'The morning: the day laid out, breakfast in one tap',
  ),
  meeting: clip(
    '04-meeting',
    600,
    1300,
    'Before a 1:1, Alice’s card on the lock screen with questions to ask; after it, the summary and the next steps',
    'Before a call and after it',
  ),
  evening: clip(
    '05-evening',
    600,
    1300,
    'The mood check-in before bed: the slider goes from Irritated to Good and the shape changes colour',
    'How was your day?',
  ),
  macFeedback: clip(
    '06-mac-feedback',
    1280,
    830,
    'A link to a Figma frame pasted into Alice in the notch, the orb thinking, and feedback for the designer opening out of the notch',
    'Feedback on a mockup, from the notch',
  ),
  macSummary: clip(
    '07-mac-summary',
    1280,
    830,
    'After a call, Alice writes it up in the notch, and the summary with the recording opens out of it',
    'The summary of a call',
  ),
  onboarding: clip(
    '08-onboarding',
    600,
    1300,
    'Onboarding: signing in with Yandex ID, Alice’s avatar coming to life, the services connected',
    'Setting Alice up',
  ),
};
