import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/metadata';
import { YandexCloudArticle } from '@/components/case/YandexCloudArticle';
import { UnlistedCasePage } from '@/components/case/CasePage';

// Shared by link alone, as Beri Zaryad's is: no card on the home page, not
// in the sitemap, and kept out of search. The share card still unfurls.
export const metadata: Metadata = {
  ...pageMetadata({
    path: '/cases/yandex-cloud',
    title: 'Yandex Cloud · Timur Nishanov',
    description:
      'A touchscreen game for the Yandex Cloud booth at Yandex Scale 2026, designed and built in code in a week and a half. The production version runs on that code.',
  }),
  robots: { index: false, follow: false },
};

export default function YandexCloudCase() {
  return (
    <UnlistedCasePage title="Yandex Cloud">
      <YandexCloudArticle backHref="/" />
    </UnlistedCasePage>
  );
}
