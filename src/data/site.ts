export const site = {
  // TODO: confirm the real contact address with Timur.
  email: 'timanemetis@gmail.com',
  telegram: 'https://t.me/Nemetis',
  linkedin: 'https://www.linkedin.com/in/timur-nishanov-3a7510428/',
  hero: {
    // New first screen (Figma 2:384): the title rides the top bar, the
    // tagline sits at the bottom, two authored lines.
    title: "Hey! I'm Timur, 27",
    tagline: ['interface and product designer', 'who builds in code'],
    // Previous hero statement — kept for when the old layout's copy is reused.
    // Authored as three lines to preserve the wide hero composition.
    text:
      "Hey! I'm Timur. I design apps,\nconcepts and interfaces, build them\nin code and measure the results.",
  },
  // Statement block after the random section (Figma text node 1:282).
  about:
    'Most of my experience is in B2C, fintech, and Web3. I work across research, complex user flows, and visual design. I shape hypotheses, test them with users, and check whether the design worked. I also use AI tools and build prototypes in code.',
  meta: {
    title: 'Timur — Senior Product Designer',
    description: 'Senior Product Designer. Worked with Yandex, Stepik, HSE, Meama, Sber, and Moneta.',
  },
} as const;
