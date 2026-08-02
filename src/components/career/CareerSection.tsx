import { career } from '@/data/career';

/**
 * Career list. Title in the statement face (same as the About line), the period
 * under it, then the tag row in the pixel face. Rows are separated by a 1px
 * hairline — on the row itself, so the last entry never draws one.
 */
export function CareerSection() {
  return (
    <section id="career" aria-labelledby="career-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="career-heading" className="sr-only">
        Career
      </h2>
      <div className="container-cases">
        {career.map((entry, i) => (
          <div
            key={entry.id}
            className={`py-[clamp(28px,3.6vw,52px)] ${
              i < career.length - 1 ? 'border-b border-[#e2e2e2]' : ''
            }`}
          >
            <h3 className="t-career-title text-ink">{entry.title}</h3>
            <p className="t-career-period mt-[clamp(4px,0.6vw,8px)] text-ink-muted">
              {entry.period}
            </p>
            <ul className="mt-[clamp(16px,2vw,28px)] flex flex-wrap gap-x-[clamp(10px,1.1vw,16px)] gap-y-[clamp(6px,0.7vw,10px)]">
              {entry.tags.map((tag) => (
                <li
                  key={tag}
                  className="pixel text-[clamp(9px,0.83vw,12px)] tracking-pixel text-ink-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
