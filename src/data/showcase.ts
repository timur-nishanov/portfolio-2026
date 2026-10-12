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
  /** The case study, when there is one: the card opens it (CaseCard). */
  href?: string;
};

// The cases after the hero, one card each (CaseShowcase). The notes condense
// the case-study copy in cases.ts: role, then the problem, then the result.
export const showcase: ShowcaseCase[] = [
  {
    id: 'chums',
    href: '/cases/chums',
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
      'The desktop app was the mobile app stretched across a big window. Quests were rooms in the chat list, and nothing said what you’d\u00a0get.',
      'Rebuilt desktop and shipped it to beta in three months. Attaching a file went from 6\u00a0steps\u00a0to\u00a01.',
      'Led design for a year and mentored a junior designer. Together we designed threads for an AI assistant and a rewards system. The concept you see here is\u00a0mine.',
    ],
  },
  {
    id: 'urbantiger',
    href: '/cases/urbantiger',
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
      'The store was designed in a hurry in 2021, and nobody had touched its UX since 2023. It no longer matched the\u00a0brand.',
      'The MVP is live. The client reported conversion at about twice the old site’s rate, with traffic down 30–40% over the same\u00a0period.',
      'Senior designer, leading two junior designers and an illustrator. We designed 28 pages at four breakpoints in three months, plus achievements and gift cards for the loyalty\u00a0section.',
    ],
  },
  {
    id: 'alice',
    href: '/cases/alice',
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
      'A chat works like a queue of requests: you have to know what to ask and remember to open the app. We moved Alice to the lock screen, where she shows up when something is about to\u00a0happen.',
      'Alice is with you all day, from a morning warm-up to a mood check-in before bed. She orders, books and writes drafts, and you confirm with one\u00a0tap.',
      '2nd place at a Yandex design battle, one point behind the winner and ahead of the other product teams. Senior designer in a studio team of five; I worked on the idea, the scenario and the\u00a0screens.',
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
