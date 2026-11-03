import type { CaseSlot } from './caseSlot';

/** The media in the Beri Zaryad case (BeriZaryadArticle): three recordings,
    each a phone on the whole of its white stage, 1080×1350 at 60fps, its
    poster its first frame. */
const clip = (name: string, alt: string, caption: string): CaseSlot => ({
  kind: 'video',
  src: `/cases/beri-zaryad/${name}.mp4`,
  poster: `/cases/beri-zaryad/${name}.webp`,
  w: 1080,
  h: 1350,
  alt,
  caption,
});

export const beriZaryadMedia = {
  take: clip(
    '01-take',
    'The map with the bonus stations picked out, a station’s card with its free slots, photos and the discount, the QR scanned and the powerbank taken',
    'Pick a station, scan the QR, take the powerbank',
  ),
  rent: clip(
    '02-rent',
    'How to get a bonus for returning a powerbank, the map during a rent showing only bonus stations, then the rent on the lock screen with a push once the phone is charged',
    'The bonus explained, then the rent on the lock screen',
  ),
  ret: clip(
    '03-return',
    'Finishing the rent at a bonus station: the code, the return, five stars for the rent and the 15% discount on the next one',
    'Return, rate, see the discount',
  ),
};
