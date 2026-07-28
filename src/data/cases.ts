import { assets } from './assets';

// A single phone in a twin-phone media block.
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

export type CaseMedia = {
  type: 'image' | 'video';
  src: string | null; // null = empty slot, render skeleton
  poster?: string;
  aspect: string; // e.g. '650/654' — fixes the slot size regardless of the file
  alt: string;
  /** object-fit for a single image/video slot. Defaults to contain. */
  fit?: 'cover' | 'contain';
  /** object-position for a cover slot — picks which part of the frame shows. */
  objectPosition?: string;
  /** When set, render these phones side by side instead of the single slot. */
  phones?: PhoneScreen[];
};

export type CaseLink = {
  label: string;
  href: string | null; // null = inactive button
};

export type CaseLogo = {
  src: string;
  x: number;
  y: number;
  w: number;
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

// Twin-phone slot proportion — near-square once two phones sit side by side.
const PHONES_ASPECT = '1/1';
// Remaining single skeleton slots (mockups still pending).
const MEDIA_ASPECT = '650/654';

// Order set by Timur: Chums, Design Battle, Meama, Yandex Go (Beri Zaryad),
// Rally last. Layout alternates by position (text-left first); each logo sits
// over that row's media column.
export const cases: Case[] = [
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
    media: {
      type: 'video',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Chums Messenger app screens',
      phones: [
        { framed: true, type: 'video', src: assets.chumsChatVideo, alt: 'Chums chat animation' },
        { framed: false, type: 'image', src: assets.chumsPreview, alt: 'Chums — choose your server screen' },
      ],
    },
    logo: { src: assets.logoChums, x: 83, y: -12, w: 17.5, drift: { x: 22, y: -85, rot: -10 } },
    layout: 'text-left',
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
    logo: { src: assets.logoAlice, x: -4, y: -13, w: 21, drift: { x: 26, y: 60, rot: 6 } },
    layout: 'text-right',
  },
  {
    id: 'case-meama',
    titleLine1: 'Meama coffee.',
    titleLine2: 'Europe and Georgian taste',
    description:
      'An international coffee brand headquartered in Berlin and Vienna, part of a large European ecosystem and expanding fast across the continent. I owned the product side of the site: reworked the overall UX, ran the discovery that validated a stack of hypotheses, concepts and design decisions, and reshaped the subscription flow so more people actually finished it.',
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'MEAMA.DE', href: null /* TODO */ },
    ],
    media: {
      type: 'video',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Meama coffee app screens',
      phones: [
        // Video already contains its own phone mockup — draw it as-is, no frame.
        // Its phone sits inset in a landscape canvas, so zoom until it matches
        // the static phone beside it.
        { framed: false, type: 'video', src: assets.meamaCase, alt: 'Meama catalogue animation', scale: 1.35 },
        { framed: false, type: 'image', src: assets.meamaStatic, alt: 'Meama product screen' },
      ],
    },
    logo: { src: assets.logoMeama, x: 83, y: -7, w: 17, drift: { x: -20, y: -72, rot: -7 } },
    layout: 'text-left',
  },
  {
    id: 'case-go',
    titleLine1: 'Yandex Go Superapp.',
    titleLine2: 'Beri Zaryad',
    description:
      "Some stations ran empty at peak hours, others sat overloaded — courier rebalancing ate the margin. Field tests in two cities showed the blocker wasn't unwillingness but uncertainty: where to go, will it fit, will the discount apply. Answer: bonus stations with routing, one-line rules and instant reward confirmation.",
    links: [{ label: 'CASE STUDY', href: null /* TODO */ }],
    // Self-contained scene video: 16:9 with three phones side by side. A square
    // object-cover box shows ~56% of the width; pulling the window close to the
    // left edge frames the first two phones (lock screen + main) and leaves the
    // third — the blue banner — outside the crop.
    media: {
      type: 'video',
      src: assets.goVideo,
      aspect: '1/1',
      fit: 'cover',
      objectPosition: '15% 50%',
      alt: 'Yandex Go Beri Zaryad app scene',
    },
    logo: { src: assets.logoGo, x: -4, y: -7, w: 22, drift: { x: -18, y: 70, rot: 8 } },
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
