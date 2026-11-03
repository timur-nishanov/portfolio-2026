import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import { BeriZaryadArticle } from '@/components/case/BeriZaryadArticle';
import { UnlistedCasePage } from '@/components/case/CasePage';

// Shared by link alone (LinkedIn, X): no card on the home page, not in the
// sitemap, and kept out of search. The share card still unfurls.
export const metadata: Metadata = {
  ...pageMetadata({
    path: '/cases/beri-zaryad',
    title: 'Beri Zaryad · Timur Nishanov',
    description:
      'Getting powerbanks back to the stations that need them: a take-home test for a powerbank rental service, finished for myself.',
  }),
  robots: { index: false, follow: false },
};

export default function BeriZaryadCase() {
  return (
    <UnlistedCasePage title="Beri Zaryad">
      <BeriZaryadArticle backHref="/" />
    </UnlistedCasePage>
  );
}
