import { menuLinks, type MenuLink } from './menu';

// The last words on the home page (Outro), set line by line as the about
// block's are (about.ts): the words in three lines, the P.S. in two. A line
// too long for a phone wraps within itself, evenly; no-break spaces keep it
// from breaking inside a phrase ("in any situation", "Open to remote work",
// "part-time or", "my head"), and a word joiner after the hyphen keeps
// "part-time" whole: the browser would break after it, and the face has no
// non-breaking hyphen. Then the links under both.
export const outroText: string[] = [
  'I believe design can be great',
  'in\u00a0any\u00a0situation. Open\u00a0to\u00a0remote\u00a0work,',
  'part-\u2060time\u00a0or just networking.',
];
// The head on the first screen: thrown at the walls, it now and then says
// "khm" (impactSound).
export const outroPostscript: string[] = ['P.S. You can throw my\u00a0head around up top.', 'It grumbles, but it’s used to it.'];

// The links under the words: the menu's (menu.ts) but GitHub, and the mail
// as Gmail's own envelope on a white disc rather than Google's G.
export const outroLinks: MenuLink[] = menuLinks
  .filter((l) => l.label !== 'GitHub')
  .map((l) => (l.kind === 'copy' ? { ...l, icon: '/icons/gmail.svg' } : l));
