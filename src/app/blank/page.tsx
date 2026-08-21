import type { Metadata } from 'next';
import { FloatingHead } from '@/components/hero/FloatingHead';

export const metadata: Metadata = {
  title: 'blank',
  // A demo stage, not a page of the site — keep crawlers off it.
  robots: { index: false, follow: false },
};

/**
 * /blank — the head alone on a white screen, for demos. Linked from nowhere
 * on the site; delete this folder (src/app/blank) to turn it off.
 */
export default function Blank() {
  return (
    <main className="relative h-dvh overflow-hidden bg-white">
      <FloatingHead />
    </main>
  );
}
