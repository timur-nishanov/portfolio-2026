import { menuLinks, type MenuLink } from './menu';
import { site } from './site';

// The last words on the home page (Outro), set line by line as the about
// block's are (about.ts): the words in three lines, the address last, the
// P.S. in two under its mark, which has a line of its own. A line too long
// for a phone wraps within itself, evenly; no-break spaces keep it from
// breaking inside a phrase ("Open to remote work", "part-time or", "a chat",
// "my head"), and a word joiner after the hyphen keeps "part-time" whole:
// the browser would break after it, and the face has no non-breaking
// hyphen. The balls with the links fall in round them.
export const outroText: string[] = [
  'Open\u00a0to\u00a0remote\u00a0work,',
  'part-\u2060time\u00a0or just a\u00a0chat.',
  site.email,
];
// The head on the first screen: thrown at the walls, it now and then says
// "khm" (impactSound).
export const outroPostscript: string[] = [
  'P.S.',
  'You can throw my\u00a0head around up top.',
  'It grumbles, but it’s used to it.',
];

// The balls: the menu's links (menu.ts) and Spotify, the mail last, as
// Gmail's own envelope on a white disc rather than Google's G.
const spotify: MenuLink = {
  kind: 'external',
  label: 'Spotify',
  icon: '/icons/spotify.svg',
  href: 'https://open.spotify.com/user/31lvoci4gojqvzj2jydxepb7raje',
};
export const outroLinks: MenuLink[] = [
  ...menuLinks.filter((l) => l.kind === 'external'),
  spotify,
  ...menuLinks.filter((l) => l.kind === 'copy').map((l) => ({ ...l, icon: '/icons/gmail.svg' })),
];
