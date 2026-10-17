/**
 * Single mapping from semantic key -> web path (TZ §1.2).
 * Components import from here only; no string paths in JSX.
 * Comment on each key = original repo/Figma layer name, so the link to the
 * mockup stays readable after renames.
 */
export const assets = {
  // Head textures — pre-processed, 1996×1996, pixel-aligned (TZ §1.3).
  headColor: '/head/head.webp', // was head.png.png
  headStill: '/head/head-700.webp', // headColor at half size, for the still head on 1x screens
  headDepth: '/head/head-depth.webp', // head-depth.png
  // 128px alpha-only silhouette used purely for the hit test. Loading the full
  // 1.8MB colour texture a second time just to read its alpha was doubling the
  // heaviest asset on the page.
  headAlpha: '/head/head-alpha.png',

  // Case mockups.
  phoneFrame: '/mockups/iphone-frame.webp', // mockup iphone.png — bezel with a fully transparent screen cutout
  chumsCaseVideo: '/mockups/chums-case-3.mp4', // chums80.mp4 (780x1688, 60fps, sharp on retina) — first case after the hero, inside the frame
  chumsCasePoster: '/mockups/chums-case-3.webp', // its first frame
  urbantigerCaseVideo: '/mockups/urbantiger-case.mp4', // urban-tiger-gift-card-60fps-2x.mp4, browser bar cropped, padded white to the iMac's 16:9 (1600x900, 60fps)
  urbantigerCasePoster: '/mockups/urbantiger-case.webp', // its first frame
  aliceCaseVideo: '/mockups/alice-case.mp4', // alice-lockscreen-60fps-v3.mp4 scaled to 780x1688 (60fps, CRF 23) — inside the iPhone frame
  aliceCasePoster: '/mockups/alice-case.webp', // its first frame
  ycCaseVideo: '/mockups/yc-case-2.mp4', // yc-bundle-spring-2560x1440-60fps.mp4, 16:9 like the iMac's screen (1600x900)
  ycCasePoster: '/mockups/yc-case-2.webp', // its first frame
  imacFrame: '/mockups/imac-frame.webp', // iMac 27" Silver — bezel with transparent screen (for recordings)
} as const;

export type AssetKey = keyof typeof assets;
