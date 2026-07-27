import { awards } from '@/data/awards';
import { AwardCard } from './AwardCard';

export function AwardsSection() {
  return (
    <section id="awards" aria-labelledby="awards-heading" className="py-[clamp(64px,8vw,120px)]">
      <h2 id="awards-heading" className="sr-only">
        Awards
      </h2>
      {/* 2 columns of 684 at 1440, 178px row gap (Figma). */}
      <div className="container-awards grid grid-cols-1 gap-x-0 gap-y-[clamp(56px,12.36vw,178px)] sm:grid-cols-2">
        {awards.map((a) => (
          <AwardCard key={a.id} award={a} />
        ))}
      </div>
    </section>
  );
}
