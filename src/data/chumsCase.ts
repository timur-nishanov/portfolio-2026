import { chumsShots, type CaseShot } from './chumsShots';

/**
 * The media in the Chums case study (ChumsArticle). A slot with a `src` draws
 * its file; one without is a quiet stand-in of the same shape until the file
 * is in — put it in /public and its path here. Videos play muted, looped and
 * inline, and load only as they come near.
 */
export type CaseSlot = {
  kind: 'video' | 'image';
  src?: string;
  poster?: string;
  alt: string;
  /** The file's own size, so its room is kept before it arrives. */
  w?: number;
  h?: number;
};

const shot = (s: CaseShot): CaseSlot => ({ kind: 'image', src: s.src, alt: s.alt, w: s.w, h: s.h });

type Pair = { before: CaseSlot; after: CaseSlot };

type ChumsMedia = {
  concept: Pair;
  /** One large pair, then rows of smaller ones. */
  desktop: { main: Pair; rows: Pair[] };
  rewards: CaseSlot[];
};

export const chumsMedia: ChumsMedia = {
  concept: {
    before: { kind: 'video', alt: 'The old Chums app: signing in to a server takes a while' },
    after: { kind: 'video', alt: 'The concept: the same sign-in, in a sheet over the chat list' },
  },
  desktop: {
    main: { before: shot(chumsShots.beforeEmoji), after: shot(chumsShots.afterEmoji) },
    rows: [
      { before: shot(chumsShots.beforeContacts), after: shot(chumsShots.afterContacts) },
      { before: shot(chumsShots.beforeRecoveryKey), after: shot(chumsShots.afterRecoveryKey) },
    ],
  },
  rewards: [
    shot(chumsShots.chatList),
    shot(chumsShots.quests),
    shot(chumsShots.walletOnboarding),
    shot(chumsShots.stats),
  ],
};

/** Where to get the app, at the case's end, each with its logo's disc. */
export const chumsLinks = [
  { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=rocks.bf.chums', icon: '/icons/google-play.svg' },
  { label: 'chums.chat', href: 'https://chums.chat/#download', icon: '/logos/chums.webp' },
  { label: 'App Store', href: 'https://apps.apple.com/no/app/chums-chat/id6458741197', icon: '/icons/app-store.svg' },
];
