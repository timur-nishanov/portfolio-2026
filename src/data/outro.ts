import { menuLinks, type MenuLink } from './menu';
import { site } from './site';

// The last words on the home page (Outro), set as the about block's are
// (about.ts): the words run on as one line of text, set in a narrow column
// and evened out there (outro.css), the address on a line of its own, the
// P.S. the same under its mark, so all of it comes out in lines of a like
// width. No-break spaces keep a phrase whole ("Open to remote work",
// "part-time or", "a chat", "my head", "up top") and the last two words
// together, and a word joiner after the hyphen keeps "part-time" whole: the
// browser would break after it, and the face has no non-breaking hyphen.
// The balls with the links fall in round them.
export const outroText: string[] = [
  'Open\u00a0to\u00a0remote\u00a0work, part-\u2060time\u00a0or just a\u00a0chat.',
  site.email,
];
// The head on the first screen: thrown at the walls, it now and then says
// "khm" (impactSound).
export const outroPostscript: string[] = [
  'P.S.',
  'You can throw my\u00a0head around up\u00a0top. It grumbles, but it’s used to\u00a0it.',
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
