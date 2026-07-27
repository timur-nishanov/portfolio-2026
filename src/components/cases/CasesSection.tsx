import { cases } from '@/data/cases';
import { CaseCard } from './CaseCard';

export function CasesSection() {
  return (
    <section id="works" aria-labelledby="works-heading" className="py-[clamp(64px,8vw,120px)]">
      <h2 id="works-heading" className="sr-only">
        Works
      </h2>
      {/* 1400px wide at 1440 (20px margins), 64px between cards — from Figma. */}
      <div className="container-cases flex flex-col gap-[clamp(24px,4.44vw,64px)]">
        {cases.map((c) => (
          <CaseCard key={c.id} data={c} />
        ))}
      </div>
    </section>
  );
}
