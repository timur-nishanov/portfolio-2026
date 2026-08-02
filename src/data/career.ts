export type CareerEntry = {
  id: string;
  title: string;
  period: string;
  tags: string[];
};

// TODO(copy): taken from the reference layout Timur sent — confirm the roles,
// dates and tag lists.
export const career: CareerEntry[] = [
  {
    id: 'career-fintech',
    title: 'Fintech Billing NDA Team',
    period: '2026 —',
    tags: ['B2B', 'FINTECH', 'BILLING', 'DESIGN SYSTEM', 'RESEARCH', 'PRODUCT'],
  },
  {
    id: 'career-cedro',
    title: 'Cedro Agency',
    period: '2022 — 2026',
    tags: ['WEB', 'B2C', 'BRANDING', 'MOTION', 'ART DIRECTION', 'AWWWARDS'],
  },
  {
    id: 'career-freelance',
    title: 'Graphic design freelance',
    period: '2022 — 2023',
    tags: ['POSTERS', 'IDENTITY', 'PRINT', 'TYPOGRAPHY'],
  },
  {
    id: 'career-marketology',
    title: 'Marketology career',
    period: '2019 — 2022',
    tags: ['ANALYTICS', 'CAMPAIGNS', 'SMM', 'COPYWRITING'],
  },
];
