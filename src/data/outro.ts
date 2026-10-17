import { menuLinks, type MenuLink } from './menu';

// The last words on the home page (Outro), over the links: paragraphs set
// line by line, as the about block's are (about.ts), broken where the sense
// breaks; a line too long for a phone wraps within itself, evenly.
export const outroText: string[][] = [
  ['Thanks for stopping by :)', 'If something here clicked, write to me.', 'I’ll answer from Bangkok.'],
  // The head on the first screen: thrown at the walls, it now and then says
  // "khm" (impactSound).
  ['P.S. You can throw my head around on the first screen.', 'It grumbles, but it’s used to it.'],
];

// The links under the words: the menu's (menu.ts) but GitHub, and the mail
// as Gmail's own envelope on a white disc rather than Google's G.
export const outroLinks: MenuLink[] = menuLinks
  .filter((l) => l.label !== 'GitHub')
  .map((l) => (l.kind === 'copy' ? { ...l, icon: '/icons/gmail.svg' } : l));
