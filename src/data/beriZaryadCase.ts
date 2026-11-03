import type { CaseSlot } from './caseSlot';

/** The media in the Beri Zaryad case (BeriZaryadArticle): from the field
    test, a friend's clip from a mall and the competitor's station card off
    the call, side by side in one box; then three recordings, each a phone on
    the whole of its white stage, 1080×1350 at 60fps. A clip's poster is its
    first frame. */
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
  field: {
    kind: 'video',
    src: '/cases/beri-zaryad/00-field.mp4',
    poster: '/cases/beri-zaryad/00-field.webp',
    w: 720,
    h: 1280,
    alt: 'A friend’s phone camera in a mall in Kirov, turning from the floor to the EnerGO station in a phone shop',
    caption: 'Looking for the station in a mall in Kirov',
  } satisfies CaseSlot,
  energo: {
    kind: 'image',
    src: '/cases/beri-zaryad/00-energo.webp',
    w: 561,
    h: 1216,
    alt: 'The EnerGO station card from the call: a photo of the spot, 0 powerbanks to take, 8 free slots to return, the tariff, the address and a route button',
    caption: 'EnerGO shows a photo of the spot and how many slots are free',
  } satisfies CaseSlot,
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
