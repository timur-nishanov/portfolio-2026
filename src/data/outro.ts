import { menuLinks, type MenuLink } from './menu';

// The last words on the home page (Outro), set line by line as the about
// block's are (about.ts), broken where the sense breaks; a line too long for
// a phone wraps within itself, evenly. Then a P.S., and the links under both.
export const outroText: string[] = [
  'I believe design can be great in any situation.',
  'Open to remote roles, part-time projects',
  'or just networking.',
];
// The head on the first screen: thrown at the walls, it now and then says
// "khm" (impactSound).
export const outroPostscript: string[] = [
  'P.S. You can throw my head around on the first screen.',
  'It grumbles, but it’s used to it.',
];

// The links under the words: the menu's (menu.ts) but GitHub, and the mail
// as Gmail's own envelope on a white disc rather than Google's G.
export const outroLinks: MenuLink[] = menuLinks
  .filter((l) => l.label !== 'GitHub')
  .map((l) => (l.kind === 'copy' ? { ...l, icon: '/icons/gmail.svg' } : l));
