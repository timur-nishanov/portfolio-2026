import type { CaseSlot } from './caseSlot';

/** The media in the Kritika case study (KritikaArticle): see CaseSlot. The
    first is the clip the Random block opens with; the rest are the phone's
    screen as recorded (the app's new design), a little slower than the app
    runs, every frame kept, so what happens in them can be followed: adding a
    review, the busiest, at 0.92 of its pace, the others at 0.95. */
type KritikaMedia = {
  /** Opening: the app in hand, as the promo video shows it. */
  inHand: CaseSlot;
  /** 01: the first run, from Shit to Oscar: signing in, a name, a photo. */
  onboarding: CaseSlot;
  /** 01: tapping the rating icons on a review, the illustration bursting. */
  ratings: CaseSlot;
  /** 02: adding a review, the poster becoming a stamp, the ratings, the text. */
  addReview: CaseSlot;
  /** 02: peeling the stamp off into the collection, then opening it. */
  peel: CaseSlot;
  /** 04: scrolling the feed and liking a review. */
  feed: CaseSlot;
  /** 04: the profile, and the badges a critic's ratings earn. */
  profile: CaseSlot;
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
  onboarding: clip(
    '05-onboarding',
    'The first run: Kritika, from Shit to Oscar, stamps drifting by and poo emoji raining down; signing in with Apple, typing a name, picking a photo, and a welcome under laurels',
    'The first run',
  ),
  ratings: clip(
    '01-ratings-2',
    'Opening a review from its stamp and tapping the rating icons: tomatoes, popcorn and Oscars burst across the screen',
    'Tapping the ratings',
  ),
  addReview: clip(
    '02-add-review-2',
    'Adding a review: a poster picked from the photos becomes a stamp, the title, the three ratings bursting into Oscars and hearts, a few words, and the review lands at the top of the feed',
    'Adding a review',
  ),
  peel: clip(
    '03-peel-2',
    'Peeling the stamp off Poor Things into the collection, then opening the collection and swiping through its stamps',
    'Peeling a stamp and opening the collection',
  ),
  feed: clip('04-feed-2', 'Scrolling the feed and liking a review', 'Scrolling the feed and liking a review'),
  profile: clip(
    '06-profile',
    'The profile: the avatar with its Fair critic badge, the laurels and the reviews, then the badges sheet: Beginner, Oscar jury, Shit lover, Tomato thrower, Softie',
    'The profile and its badges',
  ),
};
