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
  /**
   * Let the media run past the card's inner padding to the card edge, where it
   * gets clipped — the mockup reads bigger and half-off the card, as in the
   * Figma. Side is the card edge it bleeds toward.
   */
  bleed?: 'right' | 'left';
  /** Painted behind the media, so a hairline gap can never flash through. */
  bg?: string;
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
  /**
   * Hand the media column a bit more width and scale the mockup up (desktop
   * only) so it reads larger, without shrinking the copy enough to wrap the
   * title or stack the buttons. Used for the Lendly laptop.
   */
  wideMedia?: boolean;
};

// Twin-phone slot proportion — near-square once two phones sit side by side.
const PHONES_ASPECT = '1/1';

// Order set by Timur: Chums, Design Battle, Rally, Lendly, Meama, Yandex Go
// (Beri Zaryad) last. Layout still alternates left/right down the column, so
// this order needs no per-card layout flips.
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
    media: {
      type: 'image',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Yandex Design Battle Alice app screens',
      phones: [
        // Pre-composited phone (frame baked in).
        { framed: false, type: 'image', src: assets.aliceStatic1, alt: 'Alice lock-screen suggestions' },
        // Bare screen capture — same treatment as Chums: drawn inside our own
        // iPhone frame. Audio track was stripped (muted anyway via the tag).
        { framed: true, type: 'video', src: assets.aliceVideo, alt: 'Alice avatar and character picker' },
      ],
    },
    logo: { src: assets.logoAlice, x: -4, y: -13, w: 21, drift: { x: 26, y: 60, rot: 6 } },
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
    media: {
      type: 'video',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Rally app screens',
      phones: [
        // Bare screen recording drawn inside our own iPhone frame (same as
        // Chums); a pre-composited second phone beside it.
        { framed: true, type: 'video', src: assets.rallyVideo, poster: assets.rallyPoster, alt: 'Rally study session' },
        // Second phone is a screen recording too now, drawn inside our own
        // frame like the first — the pair used to be video + still.
        { framed: true, type: 'video', src: assets.rallyVideo2, alt: 'Rally categories screen' },
      ],
    },
    logo: null, // no Rally logo in the repo
    layout: 'text-left',
  },
  {
    id: 'case-lendly',
    titleLine1: 'Lendly Invest.',
    titleLine2: 'Crowdlanding platform',
    description:
      "On a crowdlending platform the investment flow is the revenue path: every extra step before a deal closes is a deal that doesn't. Interviews and usability tests with the platform's B2B investors showed the flow ran as one long undifferentiated stretch, so we broke it into discrete steps and rebuilt the site around it. Time to complete the core scenario dropped by roughly half, and follow-up research confirmed the flow felt materially easier",
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'PLATFORM', href: null /* TODO */ },
    ],
    // Ready-made MacBook mockup (frame baked in). The source PNG's transparent
    // margin AND its left drop-shadow were cropped off entirely (→ 1470×1194)
    // so the laptop body sits flush against the card's left edge. It bleeds
    // left and is scaled up via wideMedia.
    media: {
      type: 'image',
      src: assets.lendlyMacbook,
      aspect: '1470/1194',
      fit: 'contain',
      bleed: 'left',
      alt: 'Lendly Invest secondary market, on a MacBook',
    },
    logo: null, // no Lendly logo in the repo
    layout: 'text-right',
    wideMedia: true,
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
    // Single ready-made iPad mockup (frame baked in) — replaced the twin-phone
    // slot entirely. Runs to the card's right edge and is clipped there, so the
    // tablet reads large and half-off the card (Figma). The box is 730×605 at
    // the 1440 reference (650 column + the 80 card padding it eats); cover +
    // left anchoring scales the 1794×1279 art to 849 wide, so ~119px of the
    // tablet's right side is cropped by the card edge.
    media: {
      type: 'image',
      src: assets.meamaIpad,
      aspect: '730/605',
      fit: 'cover',
      objectPosition: 'left center',
      bleed: 'right',
      alt: 'Meama capsule shop, on an iPad',
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
    // Self-contained scene video: 3840×2160 with three phones side by side —
    // lock screen (~336–1306px), the green "main" screen (~1402–2429px) and the
    // blue banner (~2477–3514px). The 1:1 object-cover box shows a 2160px-wide
    // window; positioning it at 18% (left edge ≈300px) frames the first two
    // phones whole and leaves the blue banner outside the crop. Measured from a
    // decoded frame, not guessed.
    media: {
      type: 'video',
      src: assets.goVideo,
      poster: assets.goPoster,
      aspect: '1/1',
      fit: 'cover',
      objectPosition: '18% 50%',
      // The clip's own backdrop. Painted under the video so the undecoded /
      // between-loop frames can never show through as black bars.
      bg: '#eeeeee',
      alt: 'Yandex Go Beri Zaryad app scene',
    },
    logo: { src: assets.logoGo, x: -4, y: -7, w: 22, drift: { x: -18, y: 70, rot: 8 } },
    layout: 'text-right',
  },
];
