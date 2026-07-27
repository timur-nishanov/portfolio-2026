import { cases } from '@/data/cases';
import { CaseCard } from './CaseCard';

export function CasesSection() {
  return (
    <section id="works" aria-labelledby="works-heading" className="py-24 md:py-32">
      <h2 id="works-heading" className="sr-only">
        Works
      </h2>
      <div className="container-x flex flex-col gap-6 md:gap-8">
        {cases.map((c) => (
          <CaseCard key={c.id} data={c} />
        ))}
      </div>
    </section>
  );
}
