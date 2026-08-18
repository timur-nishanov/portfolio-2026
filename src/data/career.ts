export type CareerEntry = {
  id: string;
  title: string;
  period: string;
  tags: string[];
};

// Career history and skills shown in the timeline.
export const career: CareerEntry[] = [
  {
    id: 'career-fintech',
    title: 'Fintech Billing Team (NDA)',
    period: '2026 — ...',
    tags: [
      'Senior',
      'Metrics',
      'UX/UI',
      'Motion Design',
      'Hypothesis Testing',
      'A/B Testing',
      'Research',
      'AI Tools',
      'Code Prototyping',
    ],
  },
  {
    id: 'career-chums',
    title: 'Chums Messenger',
    period: '2024 — 2025',
    tags: [
      'Senior',
      'Design Lead',
      'Concepts',
      'Benchmarking',
      'Research',
      'Usability Testing',
      'Prototyping',
      'Mentoring',
    ],
  },
  {
    id: 'career-cedro',
    title: 'Cedro Agency',
    period: '2023 — 2026',
    tags: [
      'Junior',
      'Middle',
      'Senior',
      'Concepts',
      'UX/UI',
      'Benchmarking',
      'Usability Testing',
      'AI Tools',
      'Code Prototyping',
      'Creative Direction',
    ],
  },
  {
    id: 'career-freelance',
    title: 'Freelance Graphic Designer',
    period: '2022 — 2024',
    tags: [
      'Posters',
      'Presentations',
      'Banners',
      'Print Design',
      'Print Production',
      'Key Visuals',
      'Concepts',
    ],
  },
  {
    id: 'career-marketology',
    title: 'Marketing Career',
    period: '2019 — 2022',
    tags: [
      'Social Media Marketing',
      'Ad Targeting',
      'Google Ads',
      'Yandex Ads',
      'Facebook Ads Manager',
      'Content Creation',
      'Metrics',
      'Analysis',
    ],
  },
];
