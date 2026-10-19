import { assets } from './assets';

// The screen in a card's device.
// framed=true wraps the source in the iPhone frame (for a bare screen);
// framed=false draws it as-is (a render / video that already IS a mockup).
export type PhoneScreen = {
  framed: boolean;
  type: 'image' | 'video';
  src: string;
  poster?: string;
  alt: string;
  /**
   * Zoom for an unframed source whose phone sits inset in its own canvas —
   * scales it up so the phone reads at the same size as its neighbour.
   */
  scale?: number;
};

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
// each case: role, then the problem, then the result.
export const showcase: ShowcaseCase[] = [
  {
    id: 'kritika',
    href: '/cases/kritika',
    device: 'phone',
    title: 'Kritika',
    subtitle: 'Film review app, built solo',
    phone: {
      framed: true,
      type: 'video',
      src: assets.kritikaCaseVideo,
      poster: assets.kritikaCasePoster,
      alt: 'Kritika: peeling a film’s stamp into the collection, then opening the collection',
    },
    notes: [
      'A film review app I’m building alone: concept, design and SwiftUI with Claude Code. Work in\u00a0progress.',
      'Films are rated from Shit to Oscar, and the poster becomes a stamp you peel off into your\u00a0collection.',
      'Building it myself changed how I design: empty states first, and motion that wouldn’t survive a\u00a0handoff.',
    ],
  },
  {
    id: 'urbantiger',
    href: '/cases/urbantiger',
    device: 'imac',
    title: 'Urbantiger',
    subtitle: 'Eco clothing store',
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
    id: 'chums',
    href: '/cases/chums',
    device: 'phone',
    title: 'Chums',
    subtitle: 'Web3 messenger with a built-\u2060in wallet',
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
      'Redesigned the desktop app. It was in beta three months later. Attaching a file went from 6\u00a0steps\u00a0to\u00a01.',
      'Led design for a year and mentored a junior designer. Together we designed threads for an AI assistant and a rewards system. The concept you see here is\u00a0mine.',
    ],
  },
  {
    id: 'yandex-cloud',
    href: '/cases/yandex-cloud',
    device: 'imac',
    title: 'Yandex Cloud',
    subtitle: 'Touchscreen game at Yandex Scale 2026',
    phone: {
      framed: true,
      type: 'video',
      src: assets.ycCaseVideo,
      poster: assets.ycCasePoster,
      alt: 'Yandex Cloud booth game: choosing a business task',
    },
    notes: [
      'Designed the game and built the front end myself, with Claude Code, in a week and a half. The production version is based on my\u00a0code.',
      'Visitors pick a business task on a 55-\u2060inch touchscreen and put together the Yandex Cloud services that solve\u00a0it.',
      'Every result leads somewhere: points you trade for merch at the booth, and a QR code for a\u00a0consultation.',
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
      '2nd place at a Yandex design battle, one point behind the winner and ahead of the other in-\u2060house teams. Senior designer in a studio team of five; I worked on the idea, the scenario and the\u00a0screens.',
    ],
  },
];
