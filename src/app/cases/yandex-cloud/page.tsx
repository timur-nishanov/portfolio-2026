import { pageMetadata } from '@/lib/metadata';
import { CasePage } from '@/components/case/CasePage';

export const metadata = pageMetadata({
  path: '/cases/yandex-cloud',
  title: 'Yandex Cloud · Timur Nishanov',
  description:
    'A touchscreen game for the Yandex Cloud booth at Yandex Scale 2026, designed and built in code in a week and a half. The production version runs on that code.',
});

export default function YandexCloudCase() {
  return <CasePage id="yandex-cloud" />;
}
