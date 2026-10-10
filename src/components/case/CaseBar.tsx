'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { ButtonChevron } from '@/components/header/menu/icons';
import { PillGlassFilter } from '@/components/header/menu/PillGlassFilter';
import { canRefract } from '@/lib/refract';
import { BackLink } from './BackLink';

const FILTER_ID = 'lg-casebar';
// The pill reaches this far past the row on each side, as the header's does.
const PILL_PAD = 28;

type Props = {
  title: string;
  onBack?: () => void;
  backHref?: string;
  /** What scrolls under it: the layer's own scroller, or the window. */
  scrollerRef?: React.RefObject<HTMLElement | null>;
};

/**
 * The case's top bar, where the site's header is: the round back button and
 * the case's title. Like the header, it sits on the page at the top and
 * comes back on a glass pill once there is content under it; it gets out of
 * the way while reading down and returns on the first scroll up.
 */
export const CaseBar = forwardRef<HTMLDivElement, Props>(function CaseBar(
  { title, onBack, backHref, scrollerRef },
  ref,
) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [refract, setRefract] = useState(false);
  const [pillW, setPillW] = useState(0);
  const [glass, setGlass] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => setRefract(canRefract()), []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => setPillW(row.offsetWidth + PILL_PAD * 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollerRef?.current ?? null;
    const target: HTMLElement | Window = el ?? window;
    const y = () => (el ? el.scrollTop : window.scrollY);
    let last = y();
    const onScroll = () => {
      const now = y();
      setGlass(now > 24);
      if (now < 120) setHidden(false);
      else if (now > last + 2) setHidden(true);
      else if (now < last - 2) setHidden(false);
      last = now;
    };
    onScroll();
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [scrollerRef]);

  return (
    <div
      ref={ref}
      className="cp-bar"
      data-refract={refract ? '' : undefined}
      data-glass={glass ? '' : undefined}
      data-hidden={hidden ? '' : undefined}
      // Keyboard focus brings it back wherever the page is.
      onFocus={() => setHidden(false)}
    >
      {refract && pillW > 0 && <PillGlassFilter id={FILTER_ID} width={pillW} height={40} />}
      <div ref={rowRef} className="cp-bar__row">
        <span className="cp-bar__glass" aria-hidden="true" />
        <BackLink onBack={onBack} backHref={backHref} className="cp-back" label="Back to all work">
          <span className="cp-back__disc glass-disc" aria-hidden="true" />
          <ButtonChevron className="cp-back__chevron cp-chevron-left" />
        </BackLink>
        {/* The page's title, as the site's own title sits in its header. */}
        <h1 className="cp-bar__title">{title}</h1>
      </div>
    </div>
  );
});
