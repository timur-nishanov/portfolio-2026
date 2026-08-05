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
  href: string | null; // null = inactive link
};

/** One labelled paragraph in a case's copy — PROBLEMS / ROLE / RESULTS. */
export type CaseSection = {
  label: string;
  body: string;
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
  sections: CaseSection[];
  links: CaseLink[];
  media: CaseMedia;
  logo: CaseLogo | null;
  layout: 'text-left' | 'text-right';
  /**
   * Hand the media column a bit more width so the mockup reads larger, without
   * shrinking the copy enough to wrap the title or stack the links.
   */
  wideMedia?: boolean;
  /** Desktop-only scale for the mockup. 1 = as laid out. */
  mediaScale?: number;
};

// Twin-phone slot proportion — near-square once two phones sit side by side.
const PHONES_ASPECT = '1/1';

// Order and layout per Timur's deck: Chums, UrbanTiger, Design Battle, Lendly,
// Rally, Yandex Go last. Meama is out. The alternation is not left/right down
// the column any more — the phone cases put their mockups on the left, the
// desktop ones put the copy there — so `layout` is set per case.
export const cases: Case[] = [
  {
    id: 'case-chums',
    titleLine1: 'Chums Messenger.',
    titleLine2: 'crypto chatting',
    sections: [
      {
        label: 'PROBLEMS',
        body: 'A Matrix messenger with tokens, NFTs and dApps inside the chat — but the Web3 layer stayed invisible. Quest rewards nobody could find or price, and a desktop client that reused mobile components and broke on resize.',
      },
      {
        label: 'ROLE',
        body: 'Senior Product Designer. Led design processes and mentored one junior designer. Also I created new visual concept (see on mockups) which was approved by CEO',
      },
      {
        label: 'PRODUCT RESULTS',
        body: 'Reworked how the client behaves on desktop — drag-and-drop, native context menus, no full-screen pages. File attach: 6 steps → 1. It stopped feeling like a stretched mobile app, which increased Retention Rate ~x1.5.',
      },
    ],
    links: [{ label: 'CASE STUDY', href: null /* TODO */ }],
    media: {
      type: 'video',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Chums Messenger app screens',
      phones: [
        { framed: false, type: 'image', src: assets.chumsPreview, alt: 'Chums — choose your server screen' },
        { framed: true, type: 'video', src: assets.chumsChatVideo, alt: 'Chums chat animation' },
      ],
    },
    logo: { src: assets.logoChums, x: 83, y: -12, w: 17.5, drift: { x: 22, y: -85, rot: -10 } },
    layout: 'text-right',
  },
  {
    id: 'case-urbantiger',
    titleLine1: 'UrbanTiger.',
    titleLine2: 'E-commerce',
    sections: [
      {
        label: 'PROBLEMS',
        body: "A fashion ecommerce store live for four years, where the UX had accumulated friction and the visuals no longer matched the brand's updated identity. There was also nothing pulling people back — no loyalty layer, no reason to return beyond the products themselves. The client chose a full rebuild over a facelift",
      },
      {
        label: 'ROLE',
        body: 'Senior designer, 2025. Ran discovery, owned the core purchase, search and account flows, built the loyalty layer, and directed the designers and illustrator on the project.',
      },
      {
        label: 'PRODUCT RESULTS',
        body: 'Per the client, the MVP converts at 2× the old site — while incoming traffic dropped 30–40% over the same period.',
      },
    ],
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'SITE', href: null /* TODO */ },
    ],
    media: {
      type: 'image',
      src: assets.urbanImac,
      aspect: '762/655',
      fit: 'cover',
      objectPosition: 'left center',
      bleed: 'right',
      alt: 'UrbanTiger — choose design, on an iMac',
    },
    logo: null,
    layout: 'text-left',
    wideMedia: true,
  },
  {
    id: 'case-battle',
    titleLine1: 'Yandex Design Battle.',
    titleLine2: 'Kaiference Conference',
    sections: [
      {
        label: 'PROBLEMS',
        body: "Chat is a request queue. It only works if you already know what to ask and remember to open the app — which nobody does when they're under-slept or six minutes from a call.",
      },
      {
        label: 'ROLE',
        body: "Product designer, 2025. Design battle at Kaiference, studio team of 5–6. The final concept merged mine with the art director's; I took it through scenario and screen design.",
      },
      {
        label: 'RESULTS',
        body: '2nd place, one point behind first — ahead of every in-house product team. We moved Alice off the chat and onto the lock screen: cards that appear when context earns them.',
      },
    ],
    links: [{ label: 'CASE STUDY', href: null /* TODO */ }],
    media: {
      type: 'image',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Yandex Design Battle Alice app screens',
      phones: [
        { framed: false, type: 'image', src: assets.aliceStatic1, alt: 'Alice lock-screen suggestions' },
        { framed: true, type: 'video', src: assets.aliceVideo, alt: 'Alice avatar and character picker' },
      ],
    },
    logo: { src: assets.logoAlice, x: -4, y: -13, w: 21, drift: { x: 26, y: 60, rot: 6 } },
    layout: 'text-right',
  },
  {
    id: 'case-lendly',
    titleLine1: 'Lendly invest.',
    titleLine2: 'Crowdlending platform',
    sections: [
      {
        label: 'PROBLEMS',
        body: "A crowdlending platform for real-estate-backed loans, where the investment flow ran as one long undifferentiated stretch. Every extra step before a deal closes is a deal that doesn't.",
      },
      {
        label: 'ROLE',
        body: "Middle designer, 2023-2024. Ran interviews and usability tests with the platform's B2B investors, drew the scenarios, built the UI kit.",
      },
      {
        label: 'PRODUCT RESULTS',
        body: 'Broke the core flow into discrete steps. Time to complete it dropped by roughly half.',
      },
    ],
    links: [
      { label: 'CASE STUDY', href: null /* TODO */ },
      { label: 'PLATFORM', href: null /* TODO */ },
    ],
    media: {
      type: 'image',
      src: assets.lendlyImac,
      aspect: '762/655',
      fit: 'cover',
      objectPosition: 'left center',
      bleed: 'right',
      alt: 'Lendly Invest offer detail, on an iMac',
    },
    logo: null,
    layout: 'text-left',
    wideMedia: true,
  },
  {
    id: 'case-rally',
    titleLine1: 'Rally app.',
    titleLine2: 'English through your files',
    sections: [
      {
        label: 'PROBLEMS',
        body: 'Past B2 the English you need is your own — your field, your documents, whatever your tutor gave you last week — and no general course can guess it. The material is already sitting in your files; nothing turns it into practice.',
      },
      {
        label: 'ROLE',
        body: 'Designed and built solo, end to end — concept, product design, and code.',
      },
      {
        label: 'RESULT',
        body: 'Flashcards and drills generated from your own uploads, with weak spots tracked across sessions so you review what you actually miss. TestFlight soon',
      },
    ],
    links: [{ label: 'TESTFLIGHT SOON', href: null }], // inactive by design (TZ §9.2)
    media: {
      type: 'video',
      src: null,
      aspect: PHONES_ASPECT,
      alt: 'Rally app screens',
      phones: [
        { framed: true, type: 'video', src: assets.rallyVideo, poster: assets.rallyPoster, alt: 'Rally study session' },
        { framed: true, type: 'video', src: assets.rallyVideo2, alt: 'Rally categories screen' },
      ],
    },
    logo: null,
    layout: 'text-right',
  },
  {
    id: 'case-go',
    titleLine1: 'Yandex Go Superapp.',
    titleLine2: 'Beri Zaryad',
    sections: [
      {
        label: 'PROBLEMS',
        body: "Users return power banks to the same station they took them from, so stations run empty at peak hours while others sit overloaded — and couriers have to rebalance the network by hand. Field tests showed the blocker wasn't unwillingness but uncertainty: where to go, will the station take it, will the discount actually apply.",
      },
      {
        label: 'ROLE',
        body: 'Product designer, February 2025. Test assignment for Yandex Go. Ran the research, remote field tests in two Russian cities, segmentation and RICE prioritization, then designed the full flow end to end.',
      },
      {
        label: 'SOLUTION',
        body: 'Bonus stations on the map, routing to them, one-line rules and instant reward confirmation on return — scoped as an MVP against target-station returns, peak-hour balance and retention.',
      },
    ],
    links: [{ label: 'CASE STUDY', href: null /* TODO */ }],
    media: {
      type: 'video',
      src: assets.goVideo,
      poster: assets.goPoster,
      aspect: '1/1',
      fit: 'cover',
      objectPosition: '18% 50%',
      bg: '#eeeeee',
      alt: 'Yandex Go Beri Zaryad app scene',
    },
    logo: { src: assets.logoGo, x: -4, y: -7, w: 22, drift: { x: -18, y: 70, rot: 8 } },
    layout: 'text-left',
  },
];
