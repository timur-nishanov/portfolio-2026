'use client';

import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { menuTitle } from '@/data/menu';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useHideOnScroll } from '@/hooks/useScrollDirection';
import { cancelFrame, scheduleFrame, type FrameJob } from '@/lib/frame';
import { canRefract } from '@/lib/refract';
import { ButtonChevron } from './menu/icons';
import { MenuContent, type MenuContentHandle } from './menu/MenuContent';
import { MenuGlassFilter } from './menu/MenuGlassFilter';
import { PillGlassFilter } from './menu/PillGlassFilter';
import { useLiquidMorph, type MorphRefs } from './menu/useLiquidMorph';
import './menu/menu.css';

const MENU_ID = 'site-menu';
const BUTTON_ID = 'site-menu-button';

// How long the bar stays after a scroll up brought it back.
const IDLE_HIDE_MS = 5000;

/**
 * First-screen header: the title, and a round button that opens the menu as
 * an iOS-style liquid-glass panel. The panel is not faded in on top of the
 * page — the button's glass disc slips down into it and becomes it (see
 * useLiquidMorph), leaving the chevron bare while the menu is open; on close
 * the panel folds back into a disc under the chevron.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [refract, setRefract] = useState(false);
  const reduced = useReducedMotion();
  const handle = useRef<MenuContentHandle>(null);
  const focusOnOpen = useRef<'first' | 'last'>('first');
  // How the menu was opened decides whether its first row shows the keyboard
  // ring. Not :focus-visible — Chromium passes that on to programmatic focus
  // from whatever had keyboard focus before, so a click after a Tab (or after
  // Escape handed focus back to the button) lit the ring on "Works".
  const openedBy = useRef<'keyboard' | 'pointer'>('pointer');
  const [refs] = useState<MorphRefs>(() => ({
    root: createRef<HTMLElement>(),
    blend: createRef<HTMLElement>(),
    pill: createRef<HTMLElement>(),
    title: createRef<HTMLElement>(),
    button: createRef<HTMLElement>(),
    disc: createRef<HTMLElement>(),
    blob: createRef<HTMLDivElement>(),
    tint: createRef<HTMLDivElement>(),
    content: createRef<HTMLDivElement>(),
    filter: createRef<SVGFilterElement>(),
    flood: createRef<SVGFEFloodElement>(),
    displace: createRef<SVGFEDisplacementMapElement>(),
    frost: createRef<SVGFEGaussianBlurElement>(),
    saturate: createRef<SVGFEColorMatrixElement>(),
  }));

  useEffect(() => setRefract(canRefract()), []);

  // Out of the way while reading down the page, back on the first scroll up
  // (as the previous header did). Never pinned by hover: the bar has no body.
  const neverPinned = useRef(false);
  const scrollHidden = useHideOnScroll(neverPinned);

  // Brought back by a scroll up, the bar doesn't stay for good: after
  // IDLE_HIDE_MS without another scroll up it slides away again, unless the
  // pointer is on the button or the menu is open. Near the top it stays.
  const [idleHidden, setIdleHidden] = useState(false);
  const pinned = useRef(false); // pointer over the button
  const openRef = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const armIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (!pinned.current && !openRef.current && window.scrollY >= 120) setIdleHidden(true);
    }, IDLE_HIDE_MS);
  }, []);
  useEffect(() => {
    let lastY = window.scrollY;
    let y = lastY;
    // With the other scroll effects' reads and writes (lib/frame).
    const job: FrameJob = {
      read: () => {
        y = window.scrollY;
      },
      write: () => {
        if (y < 120) {
          clearTimeout(idleTimer.current);
          setIdleHidden(false);
        } else if (y < lastY) {
          setIdleHidden(false);
          armIdle();
        }
        lastY = y;
      },
    };
    const onScroll = () => scheduleFrame(job);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelFrame(job);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer.current);
    };
  }, [armIdle]);
  const hidden = scrollHidden || idleHidden;
  useLiquidMorph(open, reduced, refs);

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) refs.button.current?.focus({ preventScroll: true });
    },
    [refs],
  );

  // Over the cases the bar comes back on a glass pill, so the title and the
  // button read cleanly against whatever card is under them; over the hero
  // they sit on the page as drawn. The pill's width follows the title. It
  // stays while the menu is open: it is the title row's backing, not the
  // button's plate (the disc still leaves the chevron bare), and without it
  // the title and the chevron printed straight over a card's heading.
  const [overContent, setOverContent] = useState(false);
  const [pillW, setPillW] = useState(0);
  useEffect(() => {
    const hero = document.getElementById('main');
    const measure = () => setPillW(refs.title.current?.offsetWidth ?? 0);
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    // Over content once the hero is out of the screen below the bar's 80px.
    // Watched, not measured on every scroll.
    const io = hero
      ? new IntersectionObserver(([e]) => setOverContent(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' })
      : null;
    if (hero) io?.observe(hero);
    else setOverContent(true);
    return () => {
      io?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [refs]);

  useEffect(() => {
    openRef.current = open;
    if (!open && window.scrollY >= 120) armIdle();
  }, [open, armIdle]);

  // Scrolling down with the menu open closes it first, like an iOS menu.
  useEffect(() => {
    if (hidden && open) close(false);
  }, [hidden, open, close]);

  // Focus follows the menu in (WAI-ARIA menu button): first row, or the last
  // one when it was opened with ArrowUp.
  useEffect(() => {
    if (open) handle.current?.focusItem(focusOnOpen.current, { ring: openedBy.current === 'keyboard' });
  }, [open]);

  // Dismissal: a press anywhere outside, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && (refs.content.current?.contains(t) || refs.button.current?.contains(t))) return;
      // As on iOS, the first press outside only dismisses: it must not also
      // grab the head (Head3D listens on window, bubbling). The audio unlock
      // listens on window in the capture phase, so it still sees the press.
      e.stopPropagation();
      // Only pull focus back if it was inside the menu — a click elsewhere on
      // the page keeps whatever focus that click gave.
      close(!!refs.content.current?.contains(document.activeElement));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      close(true);
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, refs]);

  return (
    <>
      <header
        ref={refs.root}
        className="site-header"
        data-refract={refract ? '' : undefined}
        data-hidden={hidden && !open ? '' : undefined}
        data-glass={overContent ? '' : undefined}
        style={{ '--title-w': `${pillW}px` } as React.CSSProperties}
      >
        <MenuGlassFilter
          filterRef={refs.filter}
          floodRef={refs.flood}
          displaceRef={refs.displace}
          frostRef={refs.frost}
          saturateRef={refs.saturate}
        />
        {/* The pill: the title, the 8px gap, the 20px button, 28px each side. */}
        {refract && <PillGlassFilter width={pillW + 84} height={40} />}

        <div ref={refs.blob} className="lgm-blob" aria-hidden="true">
          <div ref={refs.tint} className="lgm-blob__tint" />
        </div>

        <span ref={refs.pill} className="site-header__glass" aria-hidden="true" />

        <div className="site-header__row">
          {/* data-blood-keepout: the head's blood stays off the title and the
            button (Head3D measures them). */}
          {/* Holds the title's place (the morph measures it); the title you
            see is drawn by the blend layer below. */}
          <p
            ref={refs.title as React.RefObject<HTMLParagraphElement | null>}
            className="site-title site-title--slot"
            data-blood-keepout=""
            aria-hidden="true"
          >
            {menuTitle}
          </p>
          <button
            ref={refs.button as React.RefObject<HTMLButtonElement | null>}
            id={BUTTON_ID}
            type="button"
            className="lgm-button"
            aria-label="Menu"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={MENU_ID}
            data-blood-keepout=""
            onClick={(e) => {
              // detail 0: Enter/Space (or assistive tech), not a pointer.
              openedBy.current = e.detail === 0 ? 'keyboard' : 'pointer';
              focusOnOpen.current = 'first';
              setOpen((o) => !o);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              e.preventDefault();
              openedBy.current = 'keyboard';
              focusOnOpen.current = e.key === 'ArrowUp' ? 'last' : 'first';
              if (open) handle.current?.focusItem(focusOnOpen.current, { ring: true });
              else setOpen(true);
            }}
            // Same as the menu: a press here is never a grab on the head below.
            onPointerDown={(e) => e.stopPropagation()}
            onPointerEnter={() => {
              pinned.current = true;
            }}
            onPointerLeave={() => {
              pinned.current = false;
              if (window.scrollY >= 120) armIdle();
            }}
          >
            {/* Disc and glyph are separate layers: the disc is hidden while
              the shape that takes its place moves (useLiquidMorph), and the
              chevron stays on top of it, bare once the shape has gone. */}
            <span ref={refs.disc} className="lgm-button__disc glass-disc" aria-hidden="true" />
            <span className="lgm-chev" aria-hidden="true">
              <ButtonChevron />
            </span>
          </button>
        </div>

        <MenuContent
          id={MENU_ID}
          labelledBy={BUTTON_ID}
          open={open}
          contentRef={refs.content}
          handleRef={handle}
          onClose={close}
        />
      </header>
      {/* The title, white in difference mode: dark on the light page, light
        over the head and anything dark that scrolls under it. A layer of its
        own because the header is a stacking context — inside it the blend
        would only see the header's own transparent backdrop. Same row as
        above, same hide-on-scroll. The slot stands in for the button and
        holds the chevron's second ink, which takes over while no glass is
        under the chevron (useLiquidMorph): the bare chevron of the open menu
        stays visible over the head and the dark cards. */}
      <div
        ref={refs.blend as React.RefObject<HTMLDivElement | null>}
        className="site-header site-header--blend"
        data-hidden={hidden && !open ? '' : undefined}
      >
        <div className="site-header__row">
          <p className="site-title">{menuTitle}</p>
          <span className="site-header__button-slot" aria-hidden="true">
            <span className="hb-chev">
              <ButtonChevron />
            </span>
          </span>
        </div>
      </div>
    </>
  );
}
