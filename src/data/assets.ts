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
  meamaCase: '/mockups/meama-case.mp4', // Meama-Case.mp4 — landscape, cropped into the frame
  meamaStatic: '/mockups/meama-static.png', // meama-static-case.png — pre-composited phone
  goVideo: '/mockups/go-video.mp4', // go-video.mp4 — 16:9 scene of both Beri Zaryad phones
  imacFrame: '/mockups/imac-frame.png', // iMac 27" Silver — bezel with transparent screen (for recordings)
  // Design Battle / Rally placeholder screens (pre-composited phones) — stand in
  // until Timur supplies the real case videos.
  aliceStatic1: '/mockups/alice-static-1.png',
  aliceStatic2: '/mockups/alice-static-2.png',
  rallyStatic1: '/mockups/rally-static-1.png',
  rallyStatic2: '/mockups/rally-static-2.png',
  // Desktop mockup recordings, DevTools/browser chrome cropped out and re-encoded
  // web-safe (crop 2336×1440 → 1600w H.264). Go inside the Random iMac frames.
  deskArtem: '/mockups/desk-artem.mp4', // artemartemartem.com screen recording
  deskStepicon: '/mockups/desk-stepicon.mp4', // stepicon2026.vercel.app screen recording

  // Random section (already-composited stills).
  randomAlice: '/random/alice-random.png',
  randomAppleWatch: '/random/apple-watch-random.png',
  randomBergman: '/random/bergman-poster.png',
  randomBoot: '/random/boot-random.png',
  randomMoneta: '/random/moneta-random.png', // composited iMac — used by the About block
  randomPoorThings: '/random/poorthings-random.png',
  randomRides: '/random/rides-random.png',
  randomSmartbot: '/random/smartbot-random.png',
  randomSoyun: '/random/soyun-poster.png',
  randomWallet: '/random/wallet-concept-random.png',
} as const;

export type AssetKey = keyof typeof assets;
