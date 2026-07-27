import { assets } from './assets';

export type CaseMedia = {
  type: 'image' | 'video';
  src: string | null; // null = empty slot, render skeleton
  poster?: string;
  aspect: string; // e.g. '650/654' — fixes the slot size regardless of the file
  alt: string;
};

export type CaseLink = {
  label: string;
  href: string | null; // null = inactive button
};

export type CaseLogo = {
  src: string;
  /**
   * Placement as a percentage of the card box, straight from the Figma.
   * Negative `y` means the logo deliberately breaks past the card's top edge.
   */
  x: number;
  y: number;
  w: number;
  /**
   * Scroll-parallax travel in px at the extremes of the card's viewport
   * transit. Signs differ per logo on purpose — identical vectors kill the
   * sense of depth (TZ §8) — and the amplitudes stay small so each logo
   * hangs around its own case instead of wandering off.
   */
  drift: { x: number; y: number; rot: number };
};

export type Case = {
  id: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  links: CaseLink[];
  media: CaseMedia;
  logo: CaseLogo | null;
  layout: 'text-left' | 'text-right';
};

// Mockups not delivered yet → media.src = null everywhere (skeleton slots).
// Slot proportion 650/654 is the real mockup group box from the Figma, so
// dropping the files in later cannot move the layout. TODO(media).
const MEDIA_ASPECT = '650/654';

export const cases: Case[] = [
  {
    id: 'case-go',
    titleLine1: 'Yandex Go Superapp.',
    titleLine2: 'Beri Zaryad',
    description:
      "Some stations ran empty at peak hours, others sat overloaded — courier rebalancing ate the margin. Field tests in two cities showed the blocker wasn't unwillingness but uncertainty: where to go, will it fit, will the discount apply. Answer: bonus stations with routing, one-line rules and instant reward confirmation.",
    links: [{ label: 'CASE STUDY', href: null /* TODO */ }],
    media: { type: 'image', src: null, aspect: MEDIA_ASPECT, alt: 'Yandex Go Beri Zaryad app screens' },
    logo: { src: assets.logoGo, x: 32, y: -7, w: 21, drift: { x: -18, y: 70, rot: 8 } },
    layout: 'text-left',
  },
  {
    id: 'case-chums',
    titleLine1: 'Chums Messenger.',
    titleLine2: 'crypto chatting',
    description:
      'A Matrix messenger with tokens, NFTs and dApps inside the chat — but the Web3 layer stayed invisible: wallet-linked quest rewards nobody could find or price, and a desktop client that broke on resize. Designed a new product concept, got it signed off by the founders, and led discovery and design on both workstreams.',
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'APPSTORE', href: null /* TODO */ },
    ],
    media: { type: 'image', src: null, aspect: MEDIA_ASPECT, alt: 'Chums Messenger app screens' },
    logo: { src: assets.logoChums, x: 82, y: -12, w: 17.5, drift: { x: 22, y: -85, rot: -10 } },
    layout: 'text-right',
  },
  {
    id: 'case-battle',
    titleLine1: 'Yandex Design Battle.',
    titleLine2: 'Kaiference Conference',
    description:
      'The AI race is a technology race nobody wins for long, so the brief was to design the product, not the model. Our answer: take Alice out of the chat and put her on the lock screen — proactive cards that appear when context earns them, plus a Studio mode for when you already know what you want. 2nd place, one point off first, ahead of every in-house product team.',
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'PITCHDECK', href: null /* TODO */ },
    ],
    media: { type: 'image', src: null, aspect: MEDIA_ASPECT, alt: 'Yandex Design Battle Alice app screens' },
    logo: { src: assets.logoAlice, x: 5, y: -13, w: 21, drift: { x: 26, y: 60, rot: 6 } },
    layout: 'text-left',
  },
  {
    id: 'case-meama',
    titleLine1: 'Meama coffee.',
    titleLine2: 'Europe and Georgian taste',
    // TODO(copy): real description from Timur — placeholder mirrors the mockup tone.
    description:
      'Capsule coffee crossing from Georgia into Europe: one brand, two very different shelves. The work was to keep the Georgian warmth legible to a European buyer without watering it down — packaging system, storefront and the flows that carry the taste from cart to doorstep.',
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'MEAMA.DE', href: null /* TODO */ },
    ],
    media: { type: 'image', src: null, aspect: MEDIA_ASPECT, alt: 'Meama coffee screens' },
    logo: { src: assets.logoMeama, x: 66, y: -9, w: 17, drift: { x: -20, y: -72, rot: -7 } },
    layout: 'text-right',
  },
  {
    id: 'case-rally',
    titleLine1: 'Rally app.',
    titleLine2: 'English through your files',
    // TODO(copy): real description from Timur.
    description:
      'Learn English from the things you already read: drop in your own files and Rally turns them into drills, decks and spaced review. Designed the onboarding and the study loop so the app feels like a tutor that read your documents, not a generic course.',
    links: [{ label: 'TESTFLIGHT SOON', href: null }], // inactive by design (TZ §9.2)
    media: { type: 'image', src: null, aspect: MEDIA_ASPECT, alt: 'Rally app screens' },
    logo: null, // no Rally logo in the repo
    layout: 'text-left',
  },
];
