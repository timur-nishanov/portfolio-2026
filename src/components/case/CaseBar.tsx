'use client';

import Link from 'next/link';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ButtonChevron } from '@/components/header/menu/icons';
import { BackLink } from './BackLink';

type Props = {
  title: string;
  onBack?: () => void;
  backHref?: string;
  /** What scrolls under it: the layer's own scroller, or the window. */
  scrollerRef?: React.RefObject<HTMLElement | null>;
  /** A case shared by link alone has no "back" for a visitor who came
      straight to it: the bar's button is a way home, named, in place of the
      case's title (UnlistedCasePage). */
  home?: string;
};

/**
 * The case's top bar, where the site's header is: the round back button and
 * the case's title. It sits on the page at the top; once there is content
 * under it, it stands on a solid band of the page's colour with a hairline
 * under it (case.css), so what scrolls up goes under it, cleanly, rather than
 * through it. It gets out of the way while reading down and returns on the
 * first scroll up. Only on screens too narrow for the index down the left
 * (CaseIndex), which carries the way back there.
 */
export const CaseBar = forwardRef<HTMLElement, Props>(function CaseBar({ title, onBack, backHref, scrollerRef, home }, ref) {
  const barRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => barRef.current as HTMLElement);
  const [hidden, setHidden] = useState(false);
  const [gutter, setGutter] = useState(0);

  useEffect(() => {
    const el = scrollerRef?.current ?? null;
    const target: HTMLElement | Window = el ?? window;
    const y = () => (el ? el.scrollTop : window.scrollY);
    // The layer's scrollbar is under the bar (the window's never is): the
    // band stops short of it.
    if (el) setGutter(el.offsetWidth - el.clientWidth);
    let last = y();
    const end = () =>
      el ? el.scrollHeight - el.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
    const onScroll = () => {
      const now = y();
      // Written on the bar at once rather than through a render, so the
      // band starts coming in on the very frame the page first moves.
      barRef.current?.toggleAttribute('data-glass', now > 0);
      // Back at the top, and at the end, where there is nothing left to
      // read under it and the way back is wanted.
      if (now < 120 || now >= end() - 48) setHidden(false);
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
        {home ? (
          // The disc and the name one link, home.
          <Link href={backHref ?? '/'} className="cp-bar__home">
            <span className="cp-back" aria-hidden="true">
              <span className="cp-back__disc glass-disc" />
              <ButtonChevron className="cp-back__chevron cp-chevron-left" />
            </span>
            <span className="cp-bar__title">{home}</span>
          </Link>
        ) : (
          <>
            <BackLink onBack={onBack} backHref={backHref} className="cp-back" label="Back to all work">
              <span className="cp-back__disc glass-disc" aria-hidden="true" />
              <ButtonChevron className="cp-back__chevron cp-chevron-left" />
            </BackLink>
            {/* The case's name, as the site's own sits in its header; the page's
                heading is the name at the top of the case itself. */}
            <p className="cp-bar__title">{title}</p>
          </>
        )}
      </div>
    </header>
  );
});
