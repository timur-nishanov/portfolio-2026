import type { CasePair, CaseSlot } from './caseSlot';

/** The media in the Urbantiger case study (UrbantigerArticle): see CaseSlot.
    The optional ones were "if there is one" in the copy: they stand in like
    the rest until a file comes, and go if none does. */
type UrbantigerMedia = {
  /** 01: the whole store as a flow diagram, the prototypes beside it. */
  flow: CaseSlot;
  /** 01: the three concept directions side by side, the chosen one marked. */
  concepts: CaseSlot;
  /** 02: the home page on a phone, old and new. */
  home: CasePair;
  /** 02: the catalog on desktop: the old cards, then a size picked and the
      item added to the cart right from its card. */
  catalog: CasePair;
  /** 02, optional: checkout with its three delivery options. */
  checkout: CaseSlot;
  /** 03: six states in a grid. */
  states: CaseSlot;
  /** 03, optional: one page at four screen widths. */
  breakpoints: CaseSlot;
  /** 04: the achievements screen, three badges large beside it. */
  achievements: CaseSlot;
  /** 04: the recipient opening a gift card like an envelope. */
  giftCard: CaseSlot;
  /** 04, optional: the wishlist with its collections. */
  wishlist: CaseSlot;
};

export const urbantigerMedia: UrbantigerMedia = {
  flow: { kind: 'image', alt: 'The whole store as a flow diagram, with the prototypes beside it' },
  concepts: { kind: 'image', alt: 'Three concept directions side by side, the chosen one marked' },
  home: {
    before: { kind: 'image', alt: 'Before: the old home page on a phone' },
    after: { kind: 'image', alt: 'After: the new home page on a phone' },
  },
  catalog: {
    before: { kind: 'image', alt: 'Before: the old catalog cards on desktop' },
    after: { kind: 'video', alt: 'After: picking a size and adding the item to the cart right from its catalog card' },
  },
  checkout: { kind: 'image', alt: 'Checkout with three delivery options' },
  states: {
    kind: 'image',
    alt: 'Six states: confirming sign-in, a promo code error, a bonus error, a restock alert, an empty wishlist, the first step of a return',
  },
  breakpoints: { kind: 'image', alt: 'One page at four screen widths' },
  achievements: { kind: 'image', alt: 'The achievements screen, with three badges beside it' },
  giftCard: { kind: 'video', alt: 'The recipient opening a gift card like an envelope' },
  wishlist: { kind: 'image', alt: 'The wishlist with its collections' },
};
