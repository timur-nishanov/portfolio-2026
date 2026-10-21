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
