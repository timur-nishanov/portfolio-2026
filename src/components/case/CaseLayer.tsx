'use client';

import Lenis from 'lenis';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { showcase } from '@/data/showcase';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { CaseBar } from './CaseBar';
import { CaseScroll } from './blocks';
import { CASES, loadCase, type Article } from './registry';
import { onOpenCase } from './caseStore';
import { createCaseMorph, seedFrom, type CaseMorph } from './caseMorph';
import './case.css';

/** morph: the case grows out of the card's chip or the card (caseMorph);
    off where motion is to be reduced, and the case is simply there. */
type Opened = { id: string; card: HTMLElement | null; seq: number; Article: Article; morph: boolean };
type CaseState = { case?: string; layer?: string } | null;

// Marks the history entries this page load put there itself. A case's
// address can also be an entry of its standalone page (reached by a reload,
// or with a link home from it): going back to one of those is Next's to
// render, never a cue to open the layer.
const LAYER = Math.random().toString(36).slice(2);
const ours = (state: unknown, id?: string) => {
  const s = state as CaseState;
  return s?.layer === LAYER && (id === undefined || s.case === id);
};

const caseByPath = (path: string) => {
  const p = path.replace(/\/+$/, '') || '/';
  return showcase.find((s) => s.href === p && CASES[s.id]);
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A case opens over the page, as a page of its own: its address in the bar,
 * back and forward in the browser, its own scroll — and a reload lands on
 * its standalone page (app/cases). Nothing under it moves or reloads, so
 * going back finds the page exactly as it was left.
 *
 * It grows out of where it was asked for, as the menu grows out of its
 * button: the "Case study" chip under the pointer swells into the page, or
 * the card does (a tap, the keyboard), and the case's first screen comes in
 * as the page fills the screen; closing runs it back into the card
 * (caseMorph). With motion reduced it comes and goes at once. The way back
 * is the page as it was, with focus on the card it was opened from.
 */
export function CaseLayer() {
  const { setPaused } = useSmoothScroll();
  const [opened, setOpened] = useState<Opened | null>(null);
  const openedRef = useRef<Opened | null>(null);
  const leaving = useRef(false);
  const seq = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const morphRef = useRef<CaseMorph | null>(null);

  // The article is fetched first where it is not in yet (registry): a card
  // under the pointer, or any card once the cards are near, has asked for
  // it already, so the case is on screen the frame after the click.
  // With `href`, the case's address goes into the history as the layer
  // opens (a card's click); without it, the address is there already (back
  // and forward). If the article never comes (the connection gone), the
  // case's own page is asked for instead: it has the article in its HTML.
  const begin = useCallback((id: string, card: HTMLElement | null, href?: string) => {
    if (openedRef.current || !CASES[id]) return;
    const ask = ++seq.current;
    loadCase(id)
      .then((Article) => {
        // Another case asked for since, or this one closed before it came.
        if (openedRef.current || ask !== seq.current) return;
        if (href) window.history.pushState({ case: id, layer: LAYER }, '', href);
        const o = { id, card, seq: ask, Article, morph: !reducedMotion() };
        openedRef.current = o;
        setOpened(o);
      })
      .catch(() => {
        if (ask !== seq.current) return;
        const page = href ?? showcase.find((s) => s.id === id)?.href;
        if (page) window.location.assign(page);
      });
  }, []);

  // The way out, once the address has gone back (or straight away): back
  // into the card it came from, then gone. Closed already as far as anything
  // else can tell (openedRef), so a back, an Escape or another case asked
  // for meanwhile is handled as if it were.
  const close = useCallback(() => {
    const o = openedRef.current;
    if (!o) return;
    openedRef.current = null;
    const leave = () => setOpened((cur) => (cur === o ? null : cur));
    if (morphRef.current?.close(seedFrom(o.card), leave)) return;
    setOpened(null);
  }, []);

  // The case's own scroll, read and set at once, for a Read more keeping its
  // button in view frame by frame as its regions fold.
  const caseScroll = useMemo(
    () => ({
      get: () => lenisRef.current?.animatedScroll ?? scrollRef.current?.scrollTop ?? 0,
      set: (y: number) => {
        const lenis = lenisRef.current;
        const scroller = scrollRef.current;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else if (scroller) scroller.scrollTop = y;
      },
      // A glide, for a chapter chosen in the index (CaseIndex).
      glide: (y: number) => {
        const lenis = lenisRef.current;
        const scroller = scrollRef.current;
        if (lenis) lenis.scrollTo(y, { duration: 1.1 });
        else scroller?.scrollTo({ top: y, behavior: 'smooth' });
      },
    }),
    [],
  );

  // Back, the bar's button, the end of the case, Escape: the browser's own
  // back where the case put itself in the history, so its forward still works.
  const requestClose = useCallback(() => {
    const o = openedRef.current;
    if (!o || leaving.current) return;
    if (ours(window.history.state, o.id)) {
      // Once: a second click before the address has gone back would take
      // the browser a second step back, off the site.
      leaving.current = true;
      window.history.back();
    } else {
      close();
      window.history.replaceState(window.history.state, '', '/');
    }
  }, [close]);

  // A card asks for its case.
  useEffect(
    () =>
      onOpenCase(({ id, href, card }) => {
        if (openedRef.current) return;
        begin(id, card, href);
      }),
    [begin],
  );

  // Back and forward through the case's entry.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      leaving.current = false;
      const item = caseByPath(window.location.pathname);
      const o = openedRef.current;
      // Whatever was still on its way in is not wanted here any more.
      seq.current++;
      if (o && o.id !== item?.id) close();
      else if (!o && item && ours(e.state, item.id))
        begin(item.id, document.querySelector<HTMLElement>(`#works [data-case="${item.id}"]`));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [begin, close]);

  // Escape.
  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      requestClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [opened, requestClose]);

  // The way in, before the first paint: the case is on screen in the very
  // frame the page would have been.
  useLayoutEffect(() => {
    if (!opened) return;
    const root = rootRef.current;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!root || !scroller || !content) return;
    const html = document.documentElement;
    const reduced = reducedMotion();
    const card = opened.card?.isConnected ? opened.card : null;
    // Where it grows from: read before anything below hides the chip.
    const seed = opened.morph ? seedFrom(card) : null;
    // The card's video has nothing to show while the case is over it.
    const pageVideo = card?.querySelector('video') ?? null;
    pageVideo?.pause();

    // The page underneath: still, out of reach, and out of the tab order.
    html.style.overflow = 'hidden';
    html.setAttribute('data-case-open', '');
    setPaused(true);
    const inert: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (el === root || el instanceof SVGElement || el.hasAttribute('inert')) continue;
      if (el.tagName === 'SCRIPT' || el.tagName === 'NEXT-ROUTE-ANNOUNCER') continue;
      el.setAttribute('inert', '');
      inert.push(el);
    }
    const title = document.title;
    document.title = `${CASES[opened.id].title} · Timur Nishanov`;

    // Its own smooth scroll, with the page's feel (the page's is parked).
    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reduced) {
      lenis = new Lenis({ wrapper: scroller, content, lerp: 0.09, smoothWheel: true, syncTouch: false });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    lenisRef.current = lenis;
    // Focus in the case's scroll, so the keyboard reads it down (arrows,
    // Page Down, Space) from the start; the first Tab goes to the way back:
    // the index's down the left where it is shown, else the bar's button.
    scroller.focus({ preventScroll: true });
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.shiftKey || e.target !== scroller) return;
      const backButton = [
        scroller.querySelector<HTMLElement>('.cp-index__back'),
        barRef.current?.querySelector<HTMLElement>('.cp-back'),
      ].find((el) => el && el.offsetWidth > 0);
      if (!backButton) return;
      e.preventDefault();
      backButton.focus();
    };
    scroller.addEventListener('keydown', onTab);

    // The way in, drawn before this first paint: the seed, then the growth.
    // A second click while it grows can land past the shape, on the page
    // under it (inert), and take the focus off the case: it is given back.
    const morph = opened.morph ? createCaseMorph(root) : null;
    morph?.open(seed, () => {
      if (!root.contains(document.activeElement)) scroller.focus({ preventScroll: true });
    });
    morphRef.current = morph;

    return () => {
      morph?.destroy();
      if (morphRef.current === morph) morphRef.current = null;
      scroller.removeEventListener('keydown', onTab);
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenisRef.current = null;
      html.style.overflow = '';
      html.removeAttribute('data-case-open');
      setPaused(false);
      inert.forEach((el) => el.removeAttribute('inert'));
      document.title = title;
      if (card) {
        pageVideo?.play().catch(() => {});
        card.querySelector<HTMLElement>('.cs-card__link')?.focus({ preventScroll: true });
      }
    };
  }, [opened, setPaused]);

  if (!opened) return null;
  const entry = CASES[opened.id];
  if (!entry) return null;
  const { Article } = opened;

  return createPortal(
    <div
      key={opened.seq}
      ref={rootRef}
      className="cp"
      // The way in is running (caseMorph): the first screen waits for it
      // (useReveal), as does the bar's row (case.css).
      data-morph={opened.morph ? '' : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.title} case study`}
    >
      {/* First in the tab order, though drawn over the case. */}
      <CaseBar ref={barRef} title={entry.title} onBack={requestClose} scrollerRef={scrollRef} />
      {/* data-lenis-prevent: the page's smooth scroll leaves this wheel alone;
          the case's own instance runs it. */}
      <div ref={scrollRef} className="cp__scroll" data-lenis-prevent tabIndex={-1}>
        <div ref={contentRef} className="cp__content">
          <CaseScroll.Provider value={caseScroll}>
            <Article onBack={requestClose} />
          </CaseScroll.Provider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
