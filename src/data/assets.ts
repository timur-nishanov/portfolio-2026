/**
 * Single mapping from semantic key -> web path (TZ §1.2).
 * Components import from here only; no string paths in JSX.
 * Comment on each key = original repo/Figma layer name, so the link to the
 * mockup stays readable after renames.
 */
export const assets = {
  // Full-bleed photograph the footer reveals behind the page.
  lastPhoto: '/footer/last-photo.webp',

  // Head textures — pre-processed, 1996×1996, pixel-aligned (TZ §1.3).
  headColor: '/head/head.webp', // was head.png.png
  headDepth: '/head/head-depth.webp', // head-depth.png
  // 128px alpha-only silhouette used purely for the hit test. Loading the full
  // 1.8MB colour texture a second time just to read its alpha was doubling the
  // heaviest asset on the page.
  headAlpha: '/head/head-alpha.png',

  // Case logos (all 590×590 png).
  logoGo: '/logos/go.png', // go-logo.png — Yandex Go
  logoChums: '/logos/chums.webp', // chums-logo.png
  logoAlice: '/logos/alice.png', // alice-logo.png — Yandex Design Battle / Alice

  // Laurels also exist as flat SVGs, but the Laurels component inlines the
  // path with currentColor. Kept here for reference / OG use.
  laurelGold: '/awards/laurel-gold.svg', // golden-award.svg (#FFD92D)
  laurelTeal: '/awards/laurel-teal.svg', // silver-award.svg (#0CCDD4)

  // Case mockups.
  phoneFrame: '/mockups/iphone-frame.webp', // mockup iphone.png — bezel with a fully transparent screen cutout
  chumsChatVideo: '/mockups/chums-chat.webm', // Chums chat screen.webm — goes inside the frame
  chumsPreview: '/mockups/chums-preview.webp', // chums-preview-ready.png — pre-composited phone
  goVideo: '/mockups/go-video.mp4', // go-video.mp4 — 16:9 scene of both Beri Zaryad phones
  goPoster: '/mockups/go-poster.webp', // first frame — shown until the clip decodes
  imacFrame: '/mockups/imac-frame.webp', // iMac 27" Silver — bezel with transparent screen (for recordings)
  // Design Battle: bare screen capture (goes inside our iPhone frame, same
  // treatment as Chums) + a pre-composited second phone.
  aliceStatic1: '/mockups/alice-static-1.webp',
  aliceVideo: '/mockups/alice-video.webm', // alice-vid.webm, audio track stripped
  // Ready-made iMac mockups (frame baked in) for the two desktop cases.
  urbanImac: '/mockups/urban-imac.webp',
  lendlyImac: '/mockups/lendly-imac.webp',
  // Rally: bare screen recording (drawn inside our iPhone frame, same as Chums;
  // HEVC source transcoded to muted VP9 webm) + a pre-composited second phone.
  rallyVideo: '/mockups/rally-video.webm',
  rallyPoster: '/mockups/rally-poster.jpg',
  rallyVideo2: '/mockups/rally-video-2.mp4',
  // Desktop mockup recordings that play inside the Random iMac frames.
  // desk-artem had the browser DevTools panel docked right, so it was cropped
  // (2336×1440) before re-encoding; moneta was already clean. Both 1600w H.264.
  deskArtem: '/mockups/desk-artem.mp4', // artemartemartem.com screen recording
  deskMoneta: '/mockups/desk-moneta.mp4', // moneta.ru screen recording

  // Random section (already-composited stills).
  randomAlice: '/random/alice-random.webp',
  randomAppleWatch: '/random/apple-watch-random.webp',
  randomBergman: '/random/bergman-poster.webp',
  randomBoot: '/random/boot-random.webp',
  randomPoorThings: '/random/poorthings-random.webp',
  randomRides: '/random/rides-random.webp',
  randomSmartbot: '/random/smartbot-random.webp',
  randomSoyun: '/random/soyun-poster.webp',
  randomStepicon: '/random/stepicon-random.webp', // composited iMac — stepicon2026 mockup
  randomWallet: '/random/wallet-concept-random.webp',
} as const;

export type AssetKey = keyof typeof assets;
