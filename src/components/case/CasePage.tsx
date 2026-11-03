'use client';

import dynamic from 'next/dynamic';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { CaseBar } from './CaseBar';
import { CASES } from './registry';
import './case.css';

const HOME = '/#works';

// Each case's article as a component the page can draw at build time (the
// text is in the HTML for a reload, a shared link, a crawler), its script
// fetched with the page.
const ARTICLES = Object.fromEntries(Object.entries(CASES).map(([id, entry]) => [id, dynamic(entry.load)]));

/** A case shared by link alone: no card on the home page, not in the
    registry (nothing on the home page fetches it), not in the sitemap, and
    noindex (its page's metadata). Its way out goes home, to the top, and is
    called so: a visitor came straight here, from a post, with nothing to go
    back to. */
export function UnlistedCasePage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SmoothScrollProvider>
      <CaseBar title={title} backHref="/" home="Home" />
      <main className="cp-page">{children}</main>
    </SmoothScrollProvider>
  );
}

/** A case as a page of its own: what a reload, a shared link or a new tab
    opens. The same case as the layer over the home page, back goes home. */
export function CasePage({ id }: { id: string }) {
  const entry = CASES[id];
  const Article = ARTICLES[id];
  if (!entry || !Article) return null;
  return (
    <SmoothScrollProvider>
      <CaseBar title={entry.title} backHref={HOME} />
      <main className="cp-page">
        <Article backHref={HOME} />
      </main>
    </SmoothScrollProvider>
  );
}
