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

type Pair = { before: CaseSlot; after: CaseSlot };

type ChumsMedia = {
  /** 01: signing in to a server, the old app and the concept. */
  concept: Pair;
  /** 02: the contact picker and the emoji panel, before and after. */
  contacts: Pair;
  emoji: Pair;
  /** 02: dragging a file in, the window narrowing, the wallet. */
  drag: CaseSlot;
  resize: CaseSlot;
  wallet: CaseSlot;
  /** 03: the assistant, step by step, in one phone. */
  assistant: CaseSlot;
  /** 04: the rewards system, screen by screen, in one phone. */
  rewards: CaseSlot;
};

export const chumsMedia: ChumsMedia = {
  concept: {
    before: { kind: 'video', alt: 'The old Chums app: signing in to a server' },
    after: { kind: 'video', alt: 'The concept: joining a server in a sheet over the chat list' },
  },
  contacts: {
    before: { kind: 'image', alt: 'Before: contacts open in a full window' },
    after: { kind: 'video', alt: 'After: a small contacts window opens over the chat' },
  },
  emoji: {
    before: { kind: 'image', alt: 'Before: the emoji panel across the whole window' },
    after: { kind: 'video', alt: 'After: a small emoji window above the message field' },
  },
  drag: { kind: 'video', alt: 'A file dragged into the chat window and attached' },
  resize: { kind: 'video', alt: 'The window narrowing from 1300 to 375px as the layout rearranges' },
  wallet: { kind: 'video', alt: 'The wallet popup turning into a full screen as the window narrows' },
  assistant: { kind: 'video', alt: 'Calling the assistant with @, sending a task, the thread with its answer, all the threads of a room' },
  rewards: {
    kind: 'video',
    alt: 'The rewards system: quests in the Explore tab, the first steps, your points and the season, what each room gives',
  },
};

/** Where to get the app, at the case's end, each with its logo's disc. */
export const chumsLinks = [
  { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=rocks.bf.chums', icon: '/icons/google-play.svg' },
  { label: 'chums.chat', href: 'https://chums.chat/#download', icon: '/logos/chums.webp' },
  { label: 'App Store', href: 'https://apps.apple.com/no/app/chums-chat/id6458741197', icon: '/icons/app-store.svg' },
];
