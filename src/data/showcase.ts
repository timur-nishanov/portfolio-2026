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
      'Senior Product Designer. Led design processes and mentored one junior designer. Created the new visual concept seen in the mockups, approved by the\u00a0CEO.',
      'Tokens, NFTs and dApps lived inside chat, but users couldn’t find them. The desktop client reused mobile components and broke when\u00a0resized.',
      'Reworked desktop with drag-and-drop and native context menus. Attaching a file went from 6\u00a0steps\u00a0to\u00a01. Shipped to beta three months after\u00a0approval.',
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
      'Senior designer, 2025. Ran discovery, owned the core purchase, search and account flows, built the loyalty layer, and directed the designers and illustrator on the\u00a0project.',
      'Four years in, the fashion store had piled up UX friction, its look no longer matched the new brand, and nothing brought people back. The client chose a full\u00a0rebuild.',
      'By the client’s numbers, the MVP converts at twice the old site’s rate, even with incoming traffic down\u00a030–40% over the same\u00a0period.',
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
      'Product Designer, 2025. Joined a studio team of five for the design battle at Kaiference, developed the scenario and designed the\u00a0screens.',
      'Chat works like a request queue: you have to know what to ask and remember to open the app. That falls apart when you’re short on\u00a0sleep.',
      '2nd place, one point behind the winner and ahead of every in-house team. Our concept moved Alice from chat to the lock screen, with cards that appear in\u00a0context.',
    ],
  },
];
