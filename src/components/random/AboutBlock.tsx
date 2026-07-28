import Image from 'next/image';
import { site } from '@/data/site';
import { assets } from '@/data/assets';

/**
 * Statement block after Random: the Moneta fintech dashboard on an iMac (a
 * pre-composited render), then the positioning line, centred (Figma).
 */
export function AboutBlock() {
  return (
    <section aria-label="About" className="py-[clamp(48px,7vw,110px)]">
      <div className="container-hero flex flex-col items-center">
        <div className="w-full max-w-[820px]">
          <Image
            src={assets.randomMoneta}
            alt="Moneta — online payments platform, on an iMac"
            width={2070}
            height={1666}
            sizes="(max-width: 767px) 92vw, 820px"
            className="h-auto w-full"
            priority={false}
          />
        </div>
        <p className="t-hero mt-[clamp(28px,4vw,64px)] max-w-[1000px] text-ink">{site.about}</p>
      </div>
    </section>
  );
}
