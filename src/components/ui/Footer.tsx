import { site } from '@/data/site';

/** Minimal footer — composition from Figma is thin for iteration 1. */
export function Footer() {
  return (
    <footer className="border-t border-black/5 py-10">
      <div className="container-x flex flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="pixel text-[11px] text-ink-muted">TIMUR © 2026</span>
        <a
          href={`mailto:${site.email}`}
          className="pixel text-[11px] text-ink-muted transition-colors hover:text-ink"
        >
          {site.email}
        </a>
      </div>
    </footer>
  );
}
