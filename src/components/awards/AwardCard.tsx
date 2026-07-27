import type { Award } from '@/data/awards';
import { MagneticButton } from '@/components/header/MagneticButton';
import { Laurels } from './Laurels';

export function AwardCard({ award }: { award: Award }) {
  return (
    <article className="flex flex-col items-center px-6 py-10 text-center">
      <Laurels tier={award.tier} />
      <h3 className="mt-6 max-w-[22ch] font-hoves text-[clamp(22px,2.4vw,28px)] font-medium leading-[1.15] text-ink">
        {award.title}
      </h3>
      <p className="mt-4 max-w-[34ch] font-hoves text-[14px] leading-[1.5] text-ink-muted">
        {award.description}
      </p>
      <div className="mt-8">
        <MagneticButton
          as="a"
          href={award.href}
          className="glass rounded-full"
          labelClassName="pixel px-6 py-3 text-[12px] text-ink"
        >
          MORE
        </MagneticButton>
      </div>
    </article>
  );
}
