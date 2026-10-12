import type { Metadata } from 'next';
import { CasePage } from '@/components/case/CasePage';

export const metadata: Metadata = {
  title: 'Urbantiger · Timur Nishanov',
};

export default function UrbantigerCase() {
  return <CasePage id="urbantiger" />;
}
