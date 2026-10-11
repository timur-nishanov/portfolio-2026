'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ButtonChevron } from '@/components/header/menu/icons';
import { BackLink } from './BackLink';

type Props = {
  title: string;
  onBack?: () => void;
  backHref?: string;
  /** What scrolls under it: the layer's own scroller, or the window. */
  scrollerRef?: React.RefObject<HTMLElement | null>;
};

/**
 * The case's top bar, where the site's header is: the round back button and
 * the case's title. It sits on the page at the top; once there is content
 * under it, the top edge of the screen turns the page's colour behind it
 * (case.css), so text goes under it rather than through it. It gets out of
 * the way while reading down and returns on the first scroll up.
 */
export const CaseBar = forwardRef<HTMLElement, Props>(function CaseBar({ title, onBack, backHref, scrollerRef }, ref) {
  const barRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => barRef.current as HTMLElement);
  const [hidden, setHidden] = useState(false);
  const [gutter, setGutter] = useState(0);

  useEffect(() => {
    const el = scrollerRef?.current ?? null;
    const target: HTMLElement | Window = el ?? window;
    const y = () => (el ? el.scrollTop : window.scrollY);
    // The layer's scrollbar is under the bar (the window's never is): the
    // page-coloured edge stops short of it.
    if (el) setGutter(el.offsetWidth - el.clientWidth);
    let last = y();
    const onScroll = () => {
      const now = y();
      // Written on the bar at once rather than through a render, so the
      // edge starts coming in on the very frame the page first moves.
      barRef.current?.toggleAttribute('data-glass', now > 0);
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
    <header
      ref={barRef}
      className="cp-bar"
      data-hidden={hidden ? '' : undefined}
      style={gutter ? ({ '--cp-gutter': `${gutter}px` } as React.CSSProperties) : undefined}
      // Keyboard focus brings it back wherever the page is.
      onFocus={() => setHidden(false)}
    >
      <div className="cp-bar__row">
        <BackLink onBack={onBack} backHref={backHref} className="cp-back" label="Back to all work">
          <span className="cp-back__disc glass-disc" aria-hidden="true" />
          <ButtonChevron className="cp-back__chevron cp-chevron-left" />
        </BackLink>
        {/* The page's title, as the site's own title sits in its header. */}
        <h1 className="cp-bar__title">{title}</h1>
      </div>
    </header>
  );
});
