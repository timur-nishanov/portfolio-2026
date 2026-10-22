import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/data/site';

export const metadata: Metadata = {
  title: `Page not found · ${site.name}`,
};

/**
 * The 404, in the first screen's type: the title where the header has it,
 * one line in the middle, and the way back in the subtitles' grey.
 */
export default function NotFound() {
  return (
    <>
      <header className="absolute inset-x-4 top-[18px] text-center">
        <Link href="/" className="t-title text-ink-strong">
          {site.hero.title}
        </Link>
      </header>
      <main className="grid min-h-svh place-items-center px-4 text-center">
        <div>
          <h1 className="t-title text-ink-strong">There’s no page at this address.</h1>
          <p className="t-title mt-1">
            {/* The case pages' quieter grey: readable, and ink under the pointer. */}
            <Link href="/" className="text-[rgba(8,8,10,0.57)] transition-colors hover:text-ink-strong">
              Back to the start
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
