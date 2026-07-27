import { awards } from '@/data/awards';
import { AwardCard } from './AwardCard';

export function AwardsSection() {
  return (
    <section id="awards" aria-labelledby="awards-heading" className="py-24 md:py-32">
      <h2 id="awards-heading" className="sr-only">
        Awards
      </h2>
      <div className="container-x grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2">
        {awards.map((a) => (
          <AwardCard key={a.id} award={a} />
        ))}
      </div>
    </section>
  );
}
