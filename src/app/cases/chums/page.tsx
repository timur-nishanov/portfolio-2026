import { pageMetadata } from '@/lib/metadata';
import { CasePage } from '@/components/case/CasePage';

export const metadata = pageMetadata({
  path: '/cases/chums',
  title: 'Chums · Timur Nishanov',
  description:
    'Making a Web3 messenger easier to use: a year leading design at Chums, from a mobile concept to a desktop app that works like desktop, AI threads and a rewards system.',
});

export default function ChumsCase() {
  return <CasePage id="chums" />;
}
