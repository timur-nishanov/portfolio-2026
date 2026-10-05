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
  { label: 'Life', id: 'life' },
];

export type MenuLink =
  | { kind: 'external'; label: string; icon: string; href: string }
  | { kind: 'copy'; label: string; icon: string; value: string; copiedLabel: string };

// Icons are the 16px brand marks exported from the mockup (public/icons).
export const menuLinks: MenuLink[] = [
  { kind: 'external', label: 'Linkedin', icon: '/icons/linkedin.svg', href: site.linkedin },
  { kind: 'external', label: 'X', icon: '/icons/x.svg', href: 'https://x.com/nem_etis' },
  // Gmail copies rather than opening a mail client — most visitors on a
  // desktop have no handler set up, and a dead mailto reads as a broken link.
  { kind: 'copy', label: 'Gmail', icon: '/icons/google.svg', value: site.email, copiedLabel: 'Copied' },
];
