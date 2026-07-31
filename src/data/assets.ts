/**
 * Single mapping from semantic key -> web path (TZ §1.2).
 * Components import from here only; no string paths in JSX.
 * Comment on each key = original repo/Figma layer name, so the link to the
 * mockup stays readable after renames.
 */
export const assets = {
  // Head textures — pre-processed, 1996×1996, pixel-aligned (TZ §1.3).
  headColor: '/head/head.png', // was head.png.png
  headDepth: '/head/head-depth.png', // head-depth.png

  // Case logos (all 590×590 png).
  logoGo: '/logos/go.png', // go-logo.png — Yandex Go
  logoChums: '/logos/chums.png', // chums-logo.png
  logoAlice: '/logos/alice.png', // alice-logo.png — Yandex Design Battle / Alice
  logoMeama: '/logos/meama.png', // meama-logo.png

  // Laurels also exist as flat SVGs, but the Laurels component inlines the
  // path with currentColor. Kept here for reference / OG use.
  laurelGold: '/awards/laurel-gold.svg', // golden-award.svg (#FFD92D)
  laurelTeal: '/awards/laurel-teal.svg', // silver-award.svg (#0CCDD4)

  // Case mockups.
  phoneFrame: '/mockups/iphone-frame.png', // mockup iphone.png — bezel with a fully transparent screen cutout
  chumsChatVideo: '/mockups/chums-chat.webm', // Chums chat screen.webm — goes inside the frame
  chumsPreview: '/mockups/chums-preview.png', // chums-preview-ready.png — pre-composited phone
  goVideo: '/mockups/go-video.mp4', // go-video.mp4 — 16:9 scene of both Beri Zaryad phones
  goPoster: '/mockups/go-poster.jpg', // first frame — shown until the clip decodes
  imacFrame: '/mockups/imac-frame.png', // iMac 27" Silver — bezel with transparent screen (for recordings)
  // Design Battle: bare screen capture (goes inside our iPhone frame, same
  // treatment as Chums) + a pre-composited second phone.
  aliceStatic1: '/mockups/alice-static-1.png',
  aliceVideo: '/mockups/alice-video.webm', // alice-vid.webm, audio track stripped
  // Meama's twin-phone slot was replaced by a single ready-made iPad mockup.
  meamaIpad: '/mockups/meama-ipad.png',
  // Rally: bare screen recording (drawn inside our iPhone frame, same as Chums;
  // HEVC source transcoded to muted VP9 webm) + a pre-composited second phone.
  rallyVideo: '/mockups/rally-video.webm',
  rallyPoster: '/mockups/rally-poster.jpg',
  rallyStatic2: '/mockups/rally-static-2.png',
  // Lendly: ready-made MacBook mockup (frame baked in).
  lendlyMacbook: '/mockups/lendly-macbook.png',
  // Desktop mockup recordings that play inside the Random iMac frames.
  // desk-artem had the browser DevTools panel docked right, so it was cropped
  // (2336×1440) before re-encoding; moneta was already clean. Both 1600w H.264.
  deskArtem: '/mockups/desk-artem.mp4', // artemartemartem.com screen recording
  deskMoneta: '/mockups/desk-moneta.mp4', // moneta.ru screen recording

  // Random section (already-composited stills).
  randomAlice: '/random/alice-random.png',
  randomAppleWatch: '/random/apple-watch-random.png',
  randomBergman: '/random/bergman-poster.png',
  randomBoot: '/random/boot-random.png',
  randomPoorThings: '/random/poorthings-random.png',
  randomRides: '/random/rides-random.png',
  randomSmartbot: '/random/smartbot-random.png',
  randomSoyun: '/random/soyun-poster.png',
  randomStepicon: '/random/stepicon-random.png', // composited iMac — stepicon2026 mockup
  randomWallet: '/random/wallet-concept-random.png',
} as const;

export type AssetKey = keyof typeof assets;
