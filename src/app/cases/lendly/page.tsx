import type { Metadata } from 'next';
import { CasePage } from '@/components/case/CasePage';

export const metadata: Metadata = {
  title: 'Lendly Invest · Timur Nishanov',
};

export default function LendlyCase() {
  return <CasePage id="lendly" />;
}
