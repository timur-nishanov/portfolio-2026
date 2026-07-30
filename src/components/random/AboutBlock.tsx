import { site } from '@/data/site';

/**
 * Statement block — its own section after Random (the Moneta iMac now lives in
 * the Random collage). Just the positioning line, centred (Figma text 1:282).
 */
export function AboutBlock() {
  return (
    <section aria-label="About" className="py-[clamp(48px,7vw,110px)]">
      {/* Uses the full content width (caps at the viewport minus padding on a
          1440 screen) so the longer statement holds to ~6 lines rather than
          stacking into a wall. Wraps to more on narrower desktops/tablets. */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6">
        <p className="t-hero text-ink">{site.about}</p>
      </div>
    </section>
  );
}
