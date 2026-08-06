export const site = {
  // TODO: confirm the real contact address with Timur.
  email: 'timanemetis@gmail.com',
  telegram: 'https://t.me/Nemetis',
  hero: {
    // One paragraph, rendered white with mix-blend-difference (Figma node 1:281).
    // Line breaks come from the layout width, not manual <br> — the blend over
    // the head produces the blue accent words seen in the mockup.
    text:
      "Hey, I'm Timur, a Senior Product Designer. I turn fuzzy problems into strong concepts, tested solutions, and working prototypes — from research and UI to code",
  },
  // Statement block after the random section (Figma text node 1:282).
  about:
    'Most of my experience is in B2C, fintech, and Web3. I work across research, complex user flows, and visual design. I shape hypotheses, test them with users, and check whether the design worked. I also use AI tools and build prototypes in code',
  meta: {
    title: 'Timur — Senior Product Designer',
    description: 'Senior Product Designer. Worked with Yandex, Stepik, HSE, Meama, Sber, and Moneta.',
  },
} as const;
