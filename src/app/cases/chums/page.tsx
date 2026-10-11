import type { Metadata } from 'next';
import { CasePage } from '@/components/case/CasePage';

export const metadata: Metadata = {
  title: 'Chums messenger · Timur Nishanov',
};

export default function ChumsCase() {
  return <CasePage id="chums" />;
}
