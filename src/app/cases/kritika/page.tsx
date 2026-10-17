import type { Metadata } from 'next';
import { CasePage } from '@/components/case/CasePage';

export const metadata: Metadata = {
  title: 'Kritika · Timur Nishanov',
};

export default function KritikaCase() {
  return <CasePage id="kritika" />;
}
