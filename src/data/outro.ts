import { menuLinks, type MenuLink } from './menu';
import { site } from './site';

// The last words on the home page (Outro), set line by line as the about
// block's are (about.ts): the words in two and the address under them, the
// P.S. in two under its mark, which has a line of its own. A line that has
// to wrap (a narrow phone) wraps evenly, and a no-break space keeps "my head"
// together. The balls with the links fall in round them.
export const outroText: string[] = ['Open to remote', 'work, part-time or just a chat.', site.email];
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
