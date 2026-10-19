import type { Metadata } from 'next';
import { CasePage } from '@/components/case/CasePage';

export const metadata: Metadata = {
  title: 'Yandex Cloud · Timur Nishanov',
};

export default function YandexCloudCase() {
  return <CasePage id="yandex-cloud" />;
}
