import type { PhoneScreen } from './cases';
import { assets } from './assets';

export type ShowcaseCase = {
  id: string;
  title: string;
  subtitle: string;
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
    title: 'Chums messenger',
    subtitle: 'Safe crypto chatting',
    phone: {
      framed: true,
      type: 'video',
      src: assets.chumsCaseVideo,
      poster: assets.chumsCasePoster,
      alt: 'Chums messenger: the chat list and a conversation',
    },
    //   (no-break space) keeps "6 steps to 1." on one line and every
    // note's last two words together, wherever the line breaks fall.
    notes: [
      'Senior Product Designer. Led design processes and mentored one junior designer. Created the new visual concept seen in the mockups, approved by the CEO.',
      'Tokens, NFTs and dApps lived inside chat, but users couldn’t find them. The desktop client reused mobile components and broke when resized.',
      'Reworked desktop with drag-and-drop and native context menus. Attaching a file went from 6 steps to 1. Shipped to beta three months after approval.',
    ],
  },
];
