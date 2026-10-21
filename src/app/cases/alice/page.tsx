import { pageMetadata } from '@/lib/metadata';
import { CasePage } from '@/components/case/CasePage';

export const metadata = pageMetadata({
  path: '/cases/alice',
  title: 'Yandex Alice · Timur Nishanov',
  description:
    'An AI assistant concept for a Yandex design battle: Alice moves from the chat to the lock screen and stays with you through the day. 2nd place, one point behind the winner.',
});

export default function AliceCase() {
  return <CasePage id="alice" />;
}
