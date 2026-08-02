import { career } from '@/data/career';

/**
 * Career — centred column (Figma 246:1411). Title + period share one 72px block
 * (period at 50% black), then the tags as 5by7 pills (bg #f6f6f6, 24px padding,
 * 32px radius, 12px gaps). A 1px hairline sits between entries, none after the
 * last. All measurements are the 1440 reference expressed as vw so it scales.
 */
export function CareerSection() {
  return (
    <section id="career" aria-labelledby="career-heading" className="py-[clamp(48px,7vw,110px)]">
      <h2 id="career-heading" className="sr-only">
        Career
      </h2>
      <div className="container-cases flex flex-col items-center">
        {career.map((entry, i) => (
          <div key={entry.id} className="flex w-full flex-col items-center">
            <div className="flex flex-col items-center gap-[clamp(20px,2.78vw,40px)] py-[clamp(40px,6.94vw,100px)]">
              <p className="t-hero max-w-[24ch] text-ink">
                {entry.title}
                <br />
                <span className="text-[rgba(17,17,17,0.5)]">{entry.period}</span>
              </p>
              <ul className="flex max-w-[760px] flex-wrap items-center justify-center gap-[clamp(8px,0.83vw,12px)]">
                {entry.tags.map((tag) => (
                  <li
                    key={tag}
                    className="pixel flex items-center justify-center rounded-[clamp(20px,2.22vw,32px)] bg-[#f6f6f6] px-[clamp(14px,1.67vw,24px)] py-[clamp(12px,1.67vw,24px)] text-[clamp(13px,1.389vw,20px)] leading-none text-ink"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
            {i < career.length - 1 ? <span className="h-px w-full bg-[#e2e2e2]" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
