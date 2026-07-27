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
} as const;

export type AssetKey = keyof typeof assets;
