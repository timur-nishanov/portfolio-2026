import { menuLinks, type MenuLink } from './menu';
import { site } from './site';

// The last words on the home page (Outro), set as the about block's are
// (about.ts): short lines broken where the sense breaks, the words in three,
// the address under them, the P.S. under its mark, which has a line of its
// own. Centred on a laptop, flush left on a phone (outro.css). The balls with
// the links fall in round them.
export const outroText: string[] = ['Open to remote work,', 'part-time', 'or just a chat.', site.email];
// The head on the first screen: thrown at the walls, it now and then says
// "khm" (impactSound).
export const outroPostscript: string[] = [
  'P.S.',
  'You can throw my head',
  'around up top.',
  'It grumbles,',
  'but it’s used to it.',
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
