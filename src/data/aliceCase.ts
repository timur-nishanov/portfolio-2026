import type { CaseSlot } from './caseSlot';

/** The media in the Yandex Alice case study (AliceArticle): see CaseSlot.
    The concepts were "if they're still around" in the copy: they stand in
    like the rest until a file comes, and go if none does. */
type AliceMedia = {
  /** 01, optional: several concepts side by side, and the one they became. */
  concepts: CaseSlot;
  /** 02: the lock screen at 8:03, Alice's card coming up with a warm-up. */
  lockScreen: CaseSlot;
  /** 03: the day's screens on a phone, in a row: the warm-up, the summary
      and breakfast, getting ready for a 1:1, the weekend, the mood. */
  day: CaseSlot;
  /** 03: Alice in a MacBook's notch: feedback on a Figma mockup, and a
      summary after a call. */
  notch: CaseSlot;
  /** 04: onboarding: signing in, picking an avatar and a character,
      connecting services. */
  onboarding: CaseSlot;
  /** 05: the animations from the presentation. */
  presentation: CaseSlot;
};

export const aliceMedia: AliceMedia = {
  concepts: { kind: 'image', alt: 'Several early concepts side by side, and the one they were merged into' },
  lockScreen: { kind: 'video', alt: 'The lock screen at 8:03: Alice’s card comes up and suggests a warm-up' },
  day: {
    kind: 'image',
    alt: 'The day’s screens in a row: a warm-up, the summary and breakfast, getting ready for a 1:1, the weekend, the mood',
  },
  notch: {
    kind: 'image',
    alt: 'Alice in a MacBook’s notch: feedback on a Figma mockup, and a summary after a call',
  },
  onboarding: {
    kind: 'image',
    alt: 'Onboarding: signing in, picking an avatar and a character, connecting services',
  },
  presentation: { kind: 'video', alt: 'The animations from the presentation' },
};
