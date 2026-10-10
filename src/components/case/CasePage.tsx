'use client';

import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { CaseBar } from './CaseBar';
import { CASES } from './registry';
import './case.css';

const HOME = '/#works';

/** A case as a page of its own: what a reload, a shared link or a new tab
    opens. The same case as the layer over the home page, back goes home. */
export function CasePage({ id }: { id: string }) {
  const entry = CASES[id];
  if (!entry) return null;
  const { Article } = entry;
  return (
    <SmoothScrollProvider>
      <CaseBar title={entry.title} backHref={HOME} />
      <main className="cp-page">
        <Article backHref={HOME} />
      </main>
    </SmoothScrollProvider>
  );
}
