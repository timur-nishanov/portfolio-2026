import type { CaseSlot } from './caseSlot';

/** The media in the Kritika case study (KritikaArticle): see CaseSlot. The
    first is the clip the Random block opens with; the rest stand in until
    their recordings come. */
type KritikaMedia = {
  /** Opening: the app in hand, as the promo video shows it. */
  inHand: CaseSlot;
  /** 01: tapping the rating icons, the illustration bursting. */
  ratings: CaseSlot;
  /** 02: adding a review, the poster becoming a stamp; peeling the stamp off
      into the collection (it goes if that recording isn't ready). */
  addReview: CaseSlot;
  peel: CaseSlot;
  /** 04: scrolling the feed and liking a review. */
  feed: CaseSlot;
};

export const kritikaMedia: KritikaMedia = {
  inHand: {
    kind: 'video',
    src: '/random/kritika.mp4',
    poster: '/random/kritika.webp',
    w: 1400,
    h: 978,
    alt: 'Kritika in hand: scrolling the feed, opening a review, tapping the ratings',
    caption: 'Kritika in hand',
  },
  ratings: {
    kind: 'video',
    alt: 'Tapping the rating icons on a review, the illustration bursts',
    caption: 'Tapping the ratings',
  },
  addReview: {
    kind: 'video',
    alt: 'Adding a review: the poster becomes a stamp, the title fades in from blur',
    caption: 'Adding a review',
  },
  peel: {
    kind: 'video',
    alt: 'Peeling the stamp off a film into the collection',
    caption: 'Peeling a stamp into the collection',
  },
  feed: {
    kind: 'video',
    alt: 'Scrolling the feed and liking a review',
    caption: 'Scrolling the feed and liking a review',
  },
};
