import { pageMetadata } from '@/lib/metadata';
import { CasePage } from '@/components/case/CasePage';

export const metadata = pageMetadata({
  path: '/cases/kritika',
  title: 'Kritika · Timur Nishanov',
  description:
    'A film review app for iOS, designed and built solo in SwiftUI with Claude Code. You rate a film, write what you think, and its poster turns into a stamp.',
});

export default function KritikaCase() {
  return <CasePage id="kritika" />;
}
