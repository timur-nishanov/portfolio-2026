import { site } from '@/data/site';

/**
 * PLACEHOLDER — the real SiteHeader (title + liquid-glass morphing menu) is
 * built in a parallel workstream and replaces this file at merge. It only
 * reproduces the closed title row so the layout can be built and measured:
 * title, 8px gap, 26px chevron chip, row centred ~31px from the top.
 */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-[18px] z-50 flex justify-center">
      <div className="flex items-center gap-2">
        <p className="t-title text-ink-strong">{site.hero.title}</p>
        <span aria-hidden="true" className="grid h-[26px] w-[26px] place-items-center rounded-full bg-chip">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="#151514" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </header>
  );
}
