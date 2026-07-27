import { assets } from './assets';

export type CaseMedia = {
  type: 'image' | 'video';
  src: string | null; // null = empty slot, render skeleton
  poster?: string;
  aspect: string; // e.g. '4/3' — fixes the slot size regardless of the file
  alt: string;
};

export type CaseLink = {
  label: string;
  href: string | null; // null = inactive button
};

export type CaseLogo = {
  src: string;
  parallax: number; // 0.10 … 0.35, distinct per logo (TZ §8)
  // Tailwind utility classes for placement + size of the floating logo,
  // anchored to the media column. Logos intentionally bleed past the card.
  position: string;
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
// aspect '4/3' is a provisional slot proportion for the twin-phone mockups;
// swap to the real proportion from asset inventory once files land. TODO(media).
export const cases: Case[] = [
  {
    id: 'case-go',
    titleLine1: 'Yandex Go Superapp.',
    titleLine2: 'Beri Zaryad',
    description:
      "Some stations ran empty at peak hours, others sat overloaded — courier rebalancing ate the margin. Field tests in two cities showed the blocker wasn't unwillingness but uncertainty: where to go, will it fit, will the discount apply. Answer: bonus stations with routing, one-line rules and instant reward confirmation.",
    links: [{ label: 'CASE STUDY', href: null /* TODO */ }],
    media: { type: 'image', src: null, aspect: '4/3', alt: 'Yandex Go Beri Zaryad app screens' },
    logo: { src: assets.logoGo, parallax: 0.18, position: 'top-[-7%] left-[34%] w-[30%]' },
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
    media: { type: 'image', src: null, aspect: '4/3', alt: 'Chums Messenger app screens' },
    logo: { src: assets.logoChums, parallax: 0.3, position: 'top-[-8%] right-[2%] w-[24%]' },
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
    media: { type: 'image', src: null, aspect: '4/3', alt: 'Yandex Design Battle Alice app screens' },
    logo: { src: assets.logoAlice, parallax: 0.12, position: 'top-[-9%] left-[2%] w-[26%]' },
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
    media: { type: 'image', src: null, aspect: '4/3', alt: 'Meama coffee screens' },
    logo: { src: assets.logoMeama, parallax: 0.22, position: 'top-[-6%] right-[4%] w-[22%]' },
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
    media: { type: 'image', src: null, aspect: '4/3', alt: 'Rally app screens' },
    logo: null, // no Rally logo in the repo
    layout: 'text-left',
  },
];
