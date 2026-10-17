import type { CaseSlot } from './caseSlot';

/** The media in the Urbantiger case study (UrbantigerArticle): see CaseSlot.
    The recordings are each the whole of their white stage, a browser window
    at 1280×800, as the Chums case's are. */
type UrbantigerMedia = {
  /** 01: the store as one flow, from the catalog round to loyalty. */
  flow: CaseSlot;
  /** 01: the three concept directions, then the fourth that grew out of them. */
  concepts: CaseSlot;
  /** 02: the new home page. */
  home: CaseSlot;
  /** 02: a size picked and the item added to the cart right from its card. */
  catalog: CaseSlot;
  /** 02: the product page: the gallery and the size chart in a side sheet. */
  product: CaseSlot;
  /** 02: checkout with its three delivery options. */
  checkout: CaseSlot;
  /** 03: the states: signing in, promo code and bonus errors, the empty
      cart, a return. */
  signIn: CaseSlot;
  promoBonus: CaseSlot;
  emptyCart: CaseSlot;
  returns: CaseSlot;
  /** 03: one page across the breakpoints, and on desktop and phone at once. */
  breakpoints: CaseSlot;
  devices: CaseSlot;
  /** 04: achievements, a gift card, the wishlist's collections. */
  achievements: CaseSlot;
  giftCard: CaseSlot;
  wishlist: CaseSlot;
};

/** A recording in /cases/urbantiger, its poster its first frame. */
const clip = (name: string, alt: string, caption: string): CaseSlot => ({
  kind: 'video',
  src: `/cases/urbantiger/${name}.mp4`,
  poster: `/cases/urbantiger/${name}.webp`,
  w: 1280,
  h: 800,
  alt,
  caption,
});

export const urbantigerMedia: UrbantigerMedia = {
  flow: {
    kind: 'image',
    src: '/cases/urbantiger/01-flow.webp',
    w: 1920,
    h: 789,
    alt: 'The store as one flow: catalog, product page, cart and checkout, then account and loyalty, and back to the catalog',
    caption: 'The whole store as one flow',
  },
  concepts: clip(
    '02-concepts',
    'The three concept directions for the home page, then the fourth that grew out of them, scrolled from its hero to the brand’s eco numbers',
    'Three concepts, and the fourth that became the design',
  ),
  home: clip(
    '03-home',
    'The new home page scrolled: the tennis capsule, the collections, bestsellers and the brand’s eco numbers',
    'The new home page',
  ),
  catalog: clip(
    '04-catalog',
    'The catalog: a size picked on a product card, the item added to the cart and the quick cart sliding in',
    'Picking a size and adding to the cart from the catalog',
  ),
  product: clip(
    '13-product-page',
    'The product page: the gallery opened full screen and zoomed, the size chart in a side sheet',
    'The product page: gallery zoom and the size chart',
  ),
  checkout: clip(
    '05-checkout',
    'Checkout: courier, store pickup with fitting or a pickup point, then card, installments or pay on delivery',
    'Checkout with three delivery options',
  ),
  signIn: clip('06-1-sign-in', 'Signing in by phone, the code confirmed through Telegram, VK or a call', 'Signing in by phone'),
  promoBonus: clip(
    '06-2-promo-bonus',
    'Checkout with a promo code that doesn’t work and too many bonus points, each with its own message',
    'Promo code and bonus errors',
  ),
  emptyCart: clip(
    '06-3-empty-cart',
    'The cart emptied item by item, then the empty cart with products to try',
    'The empty cart',
  ),
  returns: clip(
    '11-returns',
    'A return: the items, the reason, how to send them back, a last check, and the return request created',
    'A return, step by step',
  ),
  breakpoints: clip(
    '07-breakpoints',
    'The product page as the window narrows from desktop to phone and widens back',
    'One page across the breakpoints',
  ),
  devices: clip(
    '12-product-devices',
    'The product page on desktop and on a phone side by side, a size picked on both',
    'The product page on desktop and phone',
  ),
  achievements: clip(
    '08-achievements',
    'The achievements screen: badges in silver, gold and platinum, one unlocking with its reward',
    'Achievements and badges',
  ),
  giftCard: clip(
    '09-gift-card',
    'A gift card: a design picked, an amount set, a greeting added, then the envelope opened by the recipient',
    'Making and opening a gift card',
  ),
  wishlist: clip(
    '10-wishlist',
    'The wishlist: a collection created, items moved into it, and the collection shared by link',
    'The wishlist and its collections',
  ),
};
