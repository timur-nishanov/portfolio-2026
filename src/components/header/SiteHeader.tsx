'use client';

import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { menuTitle } from '@/data/menu';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ButtonChevron } from './menu/icons';
import { MenuContent, type MenuContentHandle } from './menu/MenuContent';
import { MenuGlassFilter } from './menu/MenuGlassFilter';
import { useLiquidMorph, type MorphRefs } from './menu/useLiquidMorph';
import './menu/menu.css';

const MENU_ID = 'site-menu';
const BUTTON_ID = 'site-menu-button';

/** backdrop-filter: url() only renders in Chromium. Safari parses it and
    paints nothing (the bare-patch failure globals.css also guards against),
    so the refracting filter is opted into per engine, not via @supports. */
function canRefract() {
  if (typeof CSS === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /(Chrome|Chromium)\//.test(ua) && !/Firefox\//.test(ua) && CSS.supports('backdrop-filter', 'url(#a)');
}

/**
 * First-screen header: the title, and a round button that opens the menu as
 * an iOS-style liquid-glass panel. The panel is not faded in on top of the
 * page — it pours out of the button (see useLiquidMorph) and folds back into
 * it on close.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [refract, setRefract] = useState(false);
  const reduced = useReducedMotion();
  const handle = useRef<MenuContentHandle>(null);
  const focusOnOpen = useRef<'first' | 'last'>('first');
  const [refs] = useState<MorphRefs>(() => ({
    root: createRef<HTMLElement>(),
    button: createRef<HTMLElement>(),
    blob: createRef<HTMLDivElement>(),
    tint: createRef<HTMLDivElement>(),
    content: createRef<HTMLDivElement>(),
    neckSvg: createRef<SVGSVGElement>(),
    neck: createRef<SVGPathElement>(),
    neckFrom: createRef<SVGStopElement>(),
    neckTo: createRef<SVGStopElement>(),
    neckGrad: createRef<SVGLinearGradientElement>(),
    filter: createRef<SVGFilterElement>(),
    flood: createRef<SVGFEFloodElement>(),
    displace: createRef<SVGFEDisplacementMapElement>(),
  }));

  useEffect(() => setRefract(canRefract()), []);
  useLiquidMorph(open, reduced, refs);

  const close = useCallback(
    (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) refs.button.current?.focus({ preventScroll: true });
    },
    [refs],
  );

  // Focus follows the menu in (WAI-ARIA menu button): first row, or the last
  // one when it was opened with ArrowUp.
  useEffect(() => {
    if (open) handle.current?.focusItem(focusOnOpen.current);
  }, [open]);

  // Dismissal: a press anywhere outside, or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && (refs.content.current?.contains(t) || refs.button.current?.contains(t))) return;
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
    <header ref={refs.root} className="site-header" data-refract={refract ? '' : undefined}>
      <MenuGlassFilter filterRef={refs.filter} floodRef={refs.flood} displaceRef={refs.displace} />

      {/* The bridge is drawn in header space (no viewBox: 1 unit = 1px). */}
      <svg ref={refs.neckSvg} className="lgm-neck" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient ref={refs.neckGrad} id="lgm-neck-fill" gradientUnits="userSpaceOnUse">
            <stop ref={refs.neckFrom} offset="0.25" stopColor="#e5e5e6" />
            <stop ref={refs.neckTo} offset="1" stopColor="#f4f4f3" />
          </linearGradient>
        </defs>
        <path ref={refs.neck} fill="url(#lgm-neck-fill)" />
      </svg>

      <div ref={refs.blob} className="lgm-blob" aria-hidden="true">
        <div ref={refs.tint} className="lgm-blob__tint" />
      </div>

      <div className="site-header__row">
        <p className="site-title">{menuTitle}</p>
        <button
          ref={refs.button as React.RefObject<HTMLButtonElement | null>}
          id={BUTTON_ID}
          type="button"
          className="lgm-button"
          aria-label="Menu"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={MENU_ID}
          onClick={() => {
            focusOnOpen.current = 'first';
            setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            focusOnOpen.current = e.key === 'ArrowUp' ? 'last' : 'first';
            if (open) handle.current?.focusItem(focusOnOpen.current);
            else setOpen(true);
          }}
          // Same as the menu: a press here is never a grab on the head below.
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ButtonChevron className="lgm-button__chevron" />
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
  );
}
