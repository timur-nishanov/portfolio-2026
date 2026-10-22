import { pageMetadata } from '@/lib/metadata';
import { CasePage } from '@/components/case/CasePage';

export const metadata = pageMetadata({
  path: '/cases/urbantiger',
  title: 'Urbantiger · Timur Nishanov',
  description:
    'Redesigning an online clothing store: 28 pages at four breakpoints in three months, from catalog to checkout, loyalty and gift cards. The MVP is live.',
});

export default function UrbantigerCase() {
  return <CasePage id="urbantiger" />;
}
