import { site } from './site';

/** The one line at the top of the first screen, beside the menu button.
    Copy lives in site.hero so the text has one source. */
export const menuTitle = site.hero.title;

export type MenuSection = {
  label: string;
  /** Section id to scroll to. The row still closes the menu when the section
      is not on the page (they are hidden while only the first screen ships). */
  id: string;
};

// Order as drawn in the menu mockup — independent of the page order.
export const menuSections: MenuSection[] = [
  { label: 'Works', id: 'works' },
  { label: 'Random', id: 'random' },
  { label: 'Awards', id: 'awards' },
  { label: 'Career', id: 'career' },
  // No CV section on the page yet: the row just closes the menu until there is.
  { label: 'CV', id: 'cv' },
];

export type MenuLink =
  | { kind: 'external'; label: string; icon: string; optical?: Optical; href: string }
  | { kind: 'copy'; label: string; icon: string; optical?: Optical; value: string; copiedLabel: string };

/** Optical fixes inside fixed boxes (CSS px): the mark's scale and vertical
 *  nudge onto the label's cap-height centre, and the label's nudge toward the
 *  mark — a diagonal X or a round G sits further from it than a stemmed L. */
export type Optical = { scale?: number; dy?: number; labelDx?: number };

// Icons are 16px brand discs (public/icons), all drawn at one size — the same
// 16px circle each, nudged onto the label's cap-height centre together.
export const menuLinks: MenuLink[] = [
  { kind: 'external', label: 'Linkedin', icon: '/icons/linkedin.svg', optical: { dy: -0.5 }, href: site.linkedin },
  { kind: 'external', label: 'X', icon: '/icons/x.svg', optical: { dy: -0.5, labelDx: -1 }, href: 'https://x.com/nem_etis' },
  { kind: 'external', label: 'GitHub', icon: '/icons/github.svg', optical: { dy: -0.5 }, href: 'https://github.com/timur-nishanov' },
  // Gmail copies rather than opening a mail client — most visitors on a
  // desktop have no handler set up, and a dead mailto reads as a broken link.
  { kind: 'copy', label: 'Gmail', icon: '/icons/google.svg', optical: { dy: -0.5, labelDx: -0.5 }, value: site.email, copiedLabel: 'Copied' },
];
