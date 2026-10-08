import type { PhoneScreen } from './cases';
import { assets } from './assets';

export type ShowcaseCase = {
  id: string;
  title: string;
  subtitle: string;
  /** The device in the middle of the card: an iPhone (title left, notes
   *  right, all centred) or an iMac (iMac left; title top right, notes
   *  bottom right). */
  device: 'phone' | 'imac';
  /** The screen recording that plays inside it. */
  phone: PhoneScreen;
  /** The right-hand notes, shown one at a time (RotatingNotes). Each one is
   *  four lines of the menu style in the reference's 340px column, like the
   *  note in the design. */
  notes: string[];
};

// The cases after the hero, one card each (CaseShowcase). The notes condense
// the case-study copy in cases.ts: role, then the problem, then the result.
export const showcase: ShowcaseCase[] = [
  {
    id: 'chums',
    device: 'phone',
    title: 'Chums messenger',
    subtitle: 'Safe crypto chatting',
    phone: {
      framed: true,
      type: 'video',
      src: assets.chumsCaseVideo,
      poster: assets.chumsCasePoster,
      alt: 'Chums messenger: the chat list and a conversation',
    },
    // \u00a0 (no-break space) keeps "6 steps to 1." on one line and every
    // note's last two words together, wherever the line breaks fall.
    notes: [
      'Tokens, NFTs and dApps lived inside the chat, but users couldn’t find them. The desktop client reused mobile components and broke when\u00a0resized.',
      'Rebuilt desktop around drag-and-drop and native context menus. Attaching a file went from 6\u00a0steps\u00a0to\u00a01.',
      'Led design for a year and mentored a junior designer. The new visual concept you see here is\u00a0mine.',
    ],
  },
  {
    id: 'urbantiger',
    device: 'imac',
    title: 'Urbantiger',
    subtitle: 'Eco ecommerce',
    phone: {
      framed: true,
      type: 'video',
      src: assets.urbantigerCaseVideo,
      poster: assets.urbantigerCasePoster,
      alt: 'Urbantiger: choosing a gift card design',
    },
    notes: [
      'The MVP converts at twice the old site’s rate, with traffic down\u00a030–40% over the same period. The client’s own\u00a0numbers.',
      'Senior designer leading two juniors and an illustrator. I owned purchase, search and account flows and covered every corner, from three login options to an 8-step\u00a0return.',
      'Nothing brought people back, so I turned loyalty into a game: achievements for purchases, eco choices and activity, with silver-to-platinum tiers and bonuses you spend at\u00a0checkout.',
    ],
  },
  {
    id: 'alice',
    device: 'phone',
    title: 'Yandex Alice',
    subtitle: 'Design battle concept',
    phone: {
      framed: true,
      type: 'video',
      src: assets.aliceCaseVideo,
      poster: assets.aliceCasePoster,
      alt: 'Alice on the lock screen: a warm-up card after a short night',
    },
    notes: [
      'Chat works like a request queue: you have to know what to ask and remember to open the app. We moved Alice to the lock screen, where she shows up when something is about to\u00a0happen.',
      'One person, one day: breakfast ordered before the daily, questions for a 1:1, a summary after it, tickets for the weekend. Alice acts, you confirm with one\u00a0tap.',
      '2nd place at a Yandex design battle, one point behind the winner and ahead of every in\u2011house team. Studio team of five; I built the scenario and the\u00a0screens.',
    ],
  },
  {
    id: 'yandex-cloud',
    device: 'imac',
    title: 'Yandex Cloud at Scale 2026',
    subtitle: 'Touchscreen game for a conference booth',
    phone: {
      framed: true,
      type: 'video',
      src: assets.ycCaseVideo,
      poster: assets.ycCasePoster,
      alt: 'Yandex Cloud booth game: choosing a business task',
    },
    notes: [
      'Designed and coded the front-end myself in a week and a half. Engineers built on my code, so design review on a tight deadline took almost no\u00a0time.',
      'Visitors drag Yandex Cloud services into a chain on a 55-inch touchscreen and hit “run”. The right chain lights up and earns a coin for the booth\u00a0contest.',
      'Two ways to play: assemble the chain yourself and get instant feedback, or pick a ready bundle and still get a\u00a0coin.',
    ],
  },
];
