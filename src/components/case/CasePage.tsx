'use client';

import { showcase } from '@/data/showcase';
import { CaseCard } from '@/components/showcase/CaseCard';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { CaseBar } from './CaseBar';
import { CASES } from './registry';
import './case.css';

const HOME = '/#works';

/** A case as a page of its own: what a reload, a shared link or a new tab
    opens. The same case as the layer over the home page, back goes home. */
export function CasePage({ id }: { id: string }) {
  const item = showcase.find((s) => s.id === id);
  const entry = CASES[id];
  if (!item || !entry) return null;
  const { Article } = entry;
  return (
    <SmoothScrollProvider>
      <CaseBar title={entry.title} backHref={HOME} />
      <main className="cp-page">
        <div className="cs cp-hero">
          <CaseCard item={item} idPrefix="cp" home={false} titleAs="h1" />
        </div>
        <Article backHref={HOME} />
      </main>
    </SmoothScrollProvider>
  );
}
