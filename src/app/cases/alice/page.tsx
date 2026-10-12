import type { Metadata } from 'next';
import { CasePage } from '@/components/case/CasePage';

export const metadata: Metadata = {
  title: 'Yandex Alice · Timur Nishanov',
};

export default function AliceCase() {
  return <CasePage id="alice" />;
}
