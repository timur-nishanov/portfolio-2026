import type { CaseSlot } from './caseSlot';

/** The media in the Kritika case study (KritikaArticle): see CaseSlot. The
    first is the clip the Random block opens with; the rest are the phone's
    screen as recorded, a little slower than the app runs, so what happens in
    them can be followed: adding a review, the busiest, at 0.92 of its pace,
    the others at 0.95. */
type KritikaMedia = {
  /** Opening: the app in hand, as the promo video shows it. */
  inHand: CaseSlot;
  /** 01: tapping the rating icons on a review, the illustration bursting. */
  ratings: CaseSlot;
  /** 02: adding a review, the photo becoming a stamp, the ratings, the text. */
  addReview: CaseSlot;
  /** 02: peeling the stamp off into the collection. */
  peel: CaseSlot;
  /** 04: scrolling the feed and liking a review. */
  feed: CaseSlot;
};

/** A recording in /cases/kritika, 600 wide, its poster its first frame. */
const clip = (name: string, alt: string, caption: string): CaseSlot => ({
  kind: 'video',
  src: `/cases/kritika/${name}.mp4`,
  poster: `/cases/kritika/${name}.webp`,
  w: 600,
  h: 1302,
  alt,
  caption,
});

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
  ratings: clip(
    '01-ratings',
    'Tapping the rating icons on a review: Oscars, popcorn and tomatoes burst across the screen',
    'Tapping the ratings',
  ),
  addReview: clip(
    '02-add-review',
    'Adding a review: the photo becomes a stamp, the title fades in from blur, the three ratings and the text, and the review lands at the top of the feed',
    'Adding a review',
  ),
  peel: clip(
    '03-peel',
    'Peeling the stamp off a film, and the stamp waiting in the collection',
    'Peeling a stamp into the collection',
  ),
  feed: clip('04-feed', 'Scrolling the feed and liking a review', 'Scrolling the feed and liking a review'),
};
