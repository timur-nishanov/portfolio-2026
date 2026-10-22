import { pageMetadata } from '@/lib/metadata';
import { CasePage } from '@/components/case/CasePage';

export const metadata = pageMetadata({
  path: '/cases/lendly',
  title: 'Lendly Invest · Timur Nishanov',
  description:
    'An investor platform for real estate crowdlending: the marketplace, two ways to buy into a loan, qualified investor status in the account, and analytics.',
});

export default function LendlyCase() {
  return <CasePage id="lendly" />;
}
