export type NavItem = {
  label: string; // shown uppercase in 5by7
  id: string; // section id to scroll to
};

// Order matters — matches both the pill row and the section order in the page,
// so the active-section observer never has to jump backwards. Awards now sits
// before Random (per the section reorder).
export const nav: NavItem[] = [
  { label: 'MAIN', id: 'main' },
  { label: 'WORKS', id: 'works' },
  { label: 'AWARDS', id: 'awards' },
  { label: 'RANDOM', id: 'random' },
  { label: 'LIFE', id: 'life' },
];
