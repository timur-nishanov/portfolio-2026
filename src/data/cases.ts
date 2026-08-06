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
    titleLine2: 'Crypto messaging',
    sections: [
      {
        label: 'PROBLEMS',
        body: 'A Matrix messenger put tokens, NFTs, and dApps inside chat, but its Web3 features were hard to find. Users could not easily locate or value quest rewards. The desktop client reused mobile components and broke when resized.',
      },
      {
        label: 'ROLE',
        body: 'Senior Product Designer. I led the design process and mentored one junior designer. I also created the visual concept shown in the mockups, which the CEO approved.',
      },
      {
        label: 'PRODUCT RESULTS',
        body: 'We reworked the desktop experience with drag-and-drop, native context menus, and no full-screen pages. Attaching a file went from 6 steps to 1. Retention increased by roughly 1.5×.',
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
        body: "After four years, the fashion e-commerce store had accumulated UX friction, and its visuals no longer matched the updated brand. It had no loyalty layer or reason to return beyond the products. The client chose a full rebuild rather than a facelift.",
      },
      {
        label: 'ROLE',
        body: 'Senior Product Designer, 2025. I ran discovery and designed the core purchase, search, account, and loyalty flows. I directed the project designers and illustrator.',
      },
      {
        label: 'PRODUCT RESULTS',
        body: 'According to the client, the MVP converts at 2× the rate of the old site, even though incoming traffic fell by 30–40% over the same period.',
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
        body: "Chat works like a request queue: you need to know what to ask and remember to open the app. That falls apart when you are short on sleep or six minutes away from a call.",
      },
      {
        label: 'ROLE',
        body: "Product Designer, 2025. I joined a 5–6-person studio team for the design battle at Kaiference. The final concept combined my idea with the art director's. I developed the scenario and designed the screens.",
      },
      {
        label: 'RESULTS',
        body: 'We took 2nd place, one point behind the winner and ahead of every in-house product team. Our concept moved Alice from chat to the lock screen, using cards that appear when the context calls for them.',
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
    titleLine1: 'Lendly Invest.',
    titleLine2: 'Crowdlending platform',
    sections: [
      {
        label: 'PROBLEMS',
        body: 'The investment flow on this real-estate-backed crowdlending platform was one long, unstructured process. Every extra step added another chance for investors to drop out before closing a deal.',
      },
      {
        label: 'ROLE',
        body: "Mid-level Product Designer, 2023–2024. I interviewed the platform's B2B investors, ran usability tests, mapped the scenarios, and built the UI kit.",
      },
      {
        label: 'PRODUCT RESULTS',
        body: 'I split the core flow into clear steps. Completion time dropped by roughly half.',
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
        body: 'Beyond B2, the English you need depends on your field, your documents, and what your tutor gave you last week. General courses cannot predict that. The material is already in your files, but nothing turns it into practice.',
      },
      {
        label: 'ROLE',
        body: 'I designed and built it solo, from the initial concept and product design through to the code.',
      },
      {
        label: 'RESULT',
        body: 'The concept generates flashcards and drills from your uploads, then tracks weak spots across sessions so you review what you actually miss. TestFlight soon.',
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
        body: "Users tend to return power banks to the station they used, leaving some stations empty at peak hours and others overloaded. Couriers then rebalance the network by hand. Field tests showed that the main blocker was uncertainty: where to go, whether a station would accept the return, and whether the discount would apply.",
      },
      {
        label: 'ROLE',
        body: 'Product Designer, February 2025. This was a test assignment for Yandex Go. I ran the research and remote field tests in two Russian cities, segmented the findings, used RICE to prioritize ideas, and designed the full flow.',
      },
      {
        label: 'SOLUTION',
        body: 'The concept highlights bonus stations on the map, routes users to them, explains the rules in one line, and confirms the reward as soon as a power bank is returned. I scoped the MVP around returns to target stations, peak-hour balance, and retention.',
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
