export type NavItem = {
  label: string; // shown uppercase in 5by7
  id: string; // section id to scroll to
};

// Order matters — matches the pill row in the header (TZ §5).
export const nav: NavItem[] = [
  { label: 'MAIN', id: 'main' },
  { label: 'WORKS', id: 'works' },
  { label: 'RANDOM', id: 'random' },
  { label: 'AWARDS', id: 'awards' },
  { label: 'LIFE', id: 'life' },
];
