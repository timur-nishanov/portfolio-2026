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
   *  right, all centred) or a monitor (monitor left; title top right, notes
   *  bottom right). */
  device: 'phone' | 'monitor';
  /** The screen recording that plays inside it. */
  phone: PhoneScreen;
  /** The right-hand notes, shown one at a time (RotatingNotes). Each one is
   *  four lines of the menu style in the reference's 340px column, like the
   *  note in the design. */
  notes: string[];
  /** The case study, when there is one: the card opens it (CaseCard). */
  href?: string;
};

// The cases after the hero, one card each (CaseShowcase). Three notes each,
// the strongest first: it is the one up as the page loads. A no-break space
// (\u00a0) keeps every note's last two words together, wherever the line
// breaks fall.
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
      'A film review app I design and build in SwiftUI with Claude Code. Films get rated from Shit to Oscar, and every poster turns into a stamp you can peel\u00a0off.',
      'Building it myself changed how I design: empty states first, and motion that wouldn’t survive a\u00a0handoff.',
      'Not in the App Store yet, but the feed, the reviews and the stamps already work on my\u00a0phone.',
    ],
  },
  {
    id: 'urbantiger',
    href: '/cases/urbantiger',
    device: 'monitor',
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
      'I led a team of three through 28 pages at four breakpoints in three months. The MVP is live, and the client reported conversion at about twice the old\u00a0rate.',
      'The store went up in a rush in 2021, and nobody touched its UX after 2023. The brand grew up. The site\u00a0didn’t.',
      'We designed the parts that usually get skipped, like promo code errors and returns, plus loyalty badges such as Night\u00a0Owl, for shopping at\u00a0night.',
    ],
  },
  {
    id: 'chums',
    href: '/cases/chums',
    device: 'phone',
    title: 'Chums',
    subtitle: 'Web3 messenger with its own wallet',
    phone: {
      framed: true,
      type: 'video',
      src: assets.chumsCaseVideo,
      poster: assets.chumsCasePoster,
      alt: 'Chums messenger: the chat list and a conversation',
    },
    notes: [
      'I led design at Chums for a year. On desktop, attaching a file took six steps. Now you drag it into the\u00a0chat.',
      'The desktop app was the phone app stretched across a big window. The redesign reached beta three months after the plan was\u00a0approved.',
      'The phone on this card is my 2024 concept. Later came AI threads and a rewards system, designed with a junior designer I\u00a0mentored.',
    ],
  },
  {
    id: 'lendly',
    device: 'monitor',
    title: 'Lendly Invest',
    // Short enough for one line beside the monitor, as the others: "…for a
    // crowdlending platform" ran to the card's edge and wrapped.
    subtitle: 'Investment flow for crowdlending',
    // No recording yet, and no case study: the monitor stands with a blank
    // screen, and the card opens nothing, until they come.
    phone: {
      framed: true,
      type: 'video',
      src: '',
      alt: 'Lendly Invest',
    },
    // The other two (what was wrong with the old flow; the role and the
    // team) are still to be written.
    notes: ['We split Lendly’s investment flow into steps, and the time it takes to invest nearly\u00a0halved.'],
  },
  {
    id: 'yandex-cloud',
    href: '/cases/yandex-cloud',
    device: 'monitor',
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
      'I designed the game and built its front end myself, with Claude Code, in a week and a half. The production version is built on my\u00a0code.',
      'A visitor at a booth has a minute or two and zero patience. So the game explains itself, and even running out of time shows you the right\u00a0answer.',
      'Every result leads somewhere: a QR code to request materials or a consultation, and in the short mode, points you trade for merch at the\u00a0booth.',
    ],
  },
  {
    id: 'alice',
    href: '/cases/alice',
    device: 'phone',
    title: 'Yandex Alice',
    subtitle: 'AI assistant concept for a Yandex design battle',
    phone: {
      framed: true,
      type: 'video',
      src: assets.aliceCaseVideo,
      poster: assets.aliceCasePoster,
      alt: 'Alice on the lock screen: a warm-up card after a short night',
    },
    notes: [
      'Nobody opens a chat after a bad night, or when a call starts in six minutes. So we took Alice out of the chat and put her on the lock\u00a0screen.',
      'She doesn’t wait to be asked. She orders, books and drafts, and you confirm with one tap. On a Mac she lives in the\u00a0notch.',
      '2nd place at a Yandex design battle, one point behind the winner. Studio team of five. I worked on the idea, the scenario and the\u00a0screens.',
    ],
  },
];
