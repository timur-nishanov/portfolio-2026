import type { CasePair as Pair, CaseSlot } from './caseSlot';

/** The media in the Chums case study (ChumsArticle): see CaseSlot. The
    recordings are each the whole of their white stage (windows at 1280×800,
    phones at 1080×1350), and the two old screenshots are set on the same
    stage, where the new window rests. */
type ChumsMedia = {
  /** 01: signing in to a server, the old app and the concept. */
  concept: Pair;
  /** 02: the contact picker and the emoji panel, before and after. */
  contacts: Pair;
  emoji: Pair;
  /** 02: dragging a file in, the attach button's window, the window
      narrowing, the wallet. */
  drag: CaseSlot;
  attach: CaseSlot;
  resize: CaseSlot;
  wallet: CaseSlot;
  /** 03: the assistant, step by step, in one phone. */
  assistant: CaseSlot;
  /** 04: the rewards system, screen by screen, in one phone. */
  rewards: CaseSlot;
};

/** A recording in /cases/chums, its poster its first frame. */
const clip = (name: string, w: number, h: number, alt: string, caption?: string): CaseSlot => ({
  kind: 'video',
  src: `/cases/chums/${name}.mp4`,
  poster: `/cases/chums/${name}.webp`,
  w,
  h,
  alt,
  caption,
});

export const chumsMedia: ChumsMedia = {
  concept: {
    before: clip('01-before-server-signin', 1080, 1350, 'The old Chums app: picking a server, then signing in to it'),
    after: clip(
      '01-after-concept',
      1080,
      1350,
      'The concept: servers at the top, joining one in a sheet over the chat list, coins in the attachment menu',
    ),
    // The app as it was and the concept beside it, not a before and after.
    labels: ['Current', 'Concept'],
  },
  contacts: {
    before: {
      kind: 'image',
      src: '/cases/chums/02-before-contacts.webp',
      w: 1440,
      h: 900,
      alt: 'Before: contacts open in a full window',
    },
    after: clip('02-after-contacts', 1280, 800, 'After: a small contacts window opens over the chat'),
  },
  emoji: {
    before: {
      kind: 'image',
      src: '/cases/chums/03-before-emoji.webp',
      w: 1440,
      h: 900,
      alt: 'Before: the emoji panel across the whole window',
    },
    after: clip('03-after-emoji', 1280, 800, 'After: a small emoji window above the message field'),
  },
  drag: clip('04-after-drag', 1280, 800, 'A file dragged into the chat window and attached', 'Dragging a file into the chat'),
  attach: clip(
    '05-after-attach-pictures',
    1280,
    800,
    'The attach button’s small window: a picture picked under Pictures and attached above the message field',
    'Attaching a picture from the attach button',
  ),
  resize: clip(
    '06-after-window-sizes',
    1280,
    800,
    'The window narrowing from 1300 to 375px as the layout rearranges',
    'Narrowing the window from 1300 to 375px',
  ),
  wallet: clip(
    '07-after-wallet',
    1280,
    800,
    'The wallet popup turning into a full screen as the window narrows',
    'The wallet in a wide window and a narrow one',
  ),
  assistant: clip(
    '08-after-threads',
    1080,
    1350,
    'Calling the assistant with @, sending a task, the thread with its answer, all the threads of a room',
    'Asking the assistant in its own thread',
  ),
  rewards: clip(
    '09-after-venom-quest',
    1080,
    1350,
    'The rewards system: quests in the Explore tab, the first steps, your points and the season, what each room gives',
    'Quests in the Explore tab, the first steps and the points',
  ),
};

/** Where to get the app, at the case's end, each with its logo's disc. */
export const chumsLinks = [
  { label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=rocks.bf.chums', icon: '/icons/google-play.svg' },
  { label: 'chums.chat', href: 'https://chums.chat/#download', icon: '/logos/chums.webp' },
  { label: 'App Store', href: 'https://apps.apple.com/no/app/chums-chat/id6458741197', icon: '/icons/app-store.svg' },
];
