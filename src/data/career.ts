export type CareerEntry = {
  id: string;
  title: string;
  period: string;
  tags: string[];
};

// Verbatim from Figma (node 246:1411) — spellings kept as designed ("reserch",
// "meida sphere", "ABC").
export const career: CareerEntry[] = [
  {
    id: 'career-fintech',
    title: 'Fintech Billing NDA Team',
    period: '2026 — ...',
    tags: [
      'Senior',
      'Metrics',
      'Ux/ui',
      'motion',
      'hypotheses',
      'reserch',
      'ai',
      'vibecode',
      'ABC',
      'Concepts',
      'prototyping',
    ],
  },
  {
    id: 'career-cedro',
    title: 'Cedro Agency',
    period: '2022 — 2026',
    tags: [
      'junior',
      'middle',
      'senior',
      'concepts',
      'Ux/ui',
      'kick-off',
      'benchmarking',
      'ai',
      'vibecode',
      'prototyping',
      'usability-tests',
      'conferences',
      'creative',
    ],
  },
  {
    id: 'career-freelance',
    title: 'Graphic design freelance',
    period: '2022 — 2023',
    tags: [
      'presentation',
      'poster',
      'banners',
      'print',
      'typography',
      'AI',
      'Creative',
      'concepts',
      'key visuals',
    ],
  },
  {
    id: 'career-marketology',
    title: 'Marketology career',
    period: '2019 — 2022',
    tags: [
      'smm',
      'targeting',
      'ads google',
      'ads yandex',
      'facebook admanager',
      'kick-off',
      'content-creation',
      'metrics',
      'analysis',
      'blogers',
      'tourism sphere',
      'it sphere',
      'meida sphere',
    ],
  },
];
