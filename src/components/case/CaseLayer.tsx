'use client';

import Lenis from 'lenis';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { showcase } from '@/data/showcase';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { zoomOf } from '@/lib/zoom';
import { CaseBar } from './CaseBar';
import { CASES } from './registry';
import { onOpenCase } from './caseStore';
import './case.css';

// The card's surface grows into the page and folds back into the card on
// an emphasised curve: it gathers, moves, and lands long and soft, so the
// motion fills its time instead of jumping and then waiting.
const GROW = 'cubic-bezier(0.2, 0, 0, 1)';
// Things going away accelerate out; things arriving settle in.
const LEAVE = 'cubic-bezier(0.4, 0, 1, 1)';
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// The choreography, in ms. In: the card's contents melt into a blur, its
// surface takes over (fading in over the card's own grey) and grows to the
// whole screen, turning the page's colour on the way; the case comes out of
// a blur once the surface is most of the way there.
const IN = { melt: 240, surfaceAt: 60, surfaceFade: 140, grow: 560, contentAt: 200 };
// Out: the case melts away, the surface folds back into the card and, a
// little before it lands, lets go of it, while the card's contents come
// back out of the blur underneath — no moment of an empty card.
const OUT = { melt: 180, foldAt: 60, fold: 480, releaseAt: 200, release: 280, settleAt: 160, settle: 440 };
const BLUR = 14; // px, the card's contents at their most melted
// Melting, the card's contents swell a touch, as if the eye went into the
// card; the case, leaving, sinks back a touch.
const SWELL = 1.06;
const SINK = 0.985;

type Opened = { id: string; card: HTMLElement | null; seq: number };
type CaseState = { case?: string; layer?: string } | null;
type Rect = { top: number; right: number; bottom: number; left: number; radius: number };

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

/** Whether the card can actually be seen: on the screen, and not faded out
    under the next card sliding over it (the cards stack, CaseShowcase). By
    geometry, not by hit-testing — the page is inert while a case is open. */
function cardSeen(card: HTMLElement | null): card is HTMLElement {
  if (!card?.isConnected) return false;
  const r = card.getBoundingClientRect();
  if (r.bottom <= 0 || r.top >= window.innerHeight || !r.width) return false;
  if (parseFloat(getComputedStyle(card).opacity) < 0.5) return false;
  const next = card.nextElementSibling;
  if (next?.classList.contains('cs-card') && next.getBoundingClientRect().top < r.top + r.height * 0.5) return false;
  return true;
}

/** The card's box inside the layer (which covers the screen from 0,0), or
    null when it can't be seen to grow out of or fold into. */
function cardBox(card: HTMLElement | null, layer: HTMLElement): Rect | null {
  if (!cardSeen(card)) return null;
  const r = card.getBoundingClientRect();
  const z = zoomOf(layer);
  const w = layer.clientWidth;
  const h = layer.clientHeight;
  // The corner as drawn, scaled with the card when it is receding.
  const radius = (parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0) * (r.width / z / card.offsetWidth);
  return { top: r.top / z, right: w - r.right / z, bottom: h - r.bottom / z, left: r.left / z, radius };
}

const inset = (b: Rect) => `inset(${b.top}px ${b.right}px ${b.bottom}px ${b.left}px round ${b.radius}px)`;
const FULL = 'inset(0px 0px 0px 0px round 0px)';

/** What melts away on the card: everything but its link, which draws nothing. */
const cardParts = (card: HTMLElement | null) =>
  card ? Array.from(card.children).filter((el) => !el.classList.contains('cs-card__link')) : [];

const onScreen = (el: HTMLElement | null | undefined): el is HTMLElement => {
  const r = el?.getBoundingClientRect();
  return !!r && r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
};

/**
 * The one thing that carries over: the case's name. It travels between the
 * card's title and the bar's — the same 20px type in both, so it only moves,
 * never scales — in a stand-in (the layer's .cp-fly) laid over both. The
 * two titles are worded a touch differently ("Chums messenger" on the card,
 * "Chums Messenger" on the page), so the stand-in changes its wording early
 * on, while it is moving fast, and arrives as the very text it lands on: it
 * hands over without a crossfade. Visible only while the flight runs.
 */
function flyTitle(
  fly: HTMLElement,
  from: { rect: DOMRect; text: string | null },
  to: HTMLElement,
  layer: HTMLElement,
  duration: number,
) {
  const z = zoomOf(layer);
  const a = from.rect;
  const b = to.getBoundingClientRect();
  const start = document.createElement('span');
  const end = document.createElement('span');
  start.textContent = from.text;
  end.textContent = to.textContent;
  end.className = 'cp-fly__to';
  fly.replaceChildren(start, end);
  fly.style.left = `${a.left / z}px`;
  fly.style.top = `${a.top / z}px`;
  const swap = [0, 0.22, 0.34, 1];
  return [
    fly.animate(
      [
        { transform: 'translate(0px, 0px)', visibility: 'visible' },
        { transform: `translate(${(b.left - a.left) / z}px, ${(b.top - a.top) / z}px)`, visibility: 'visible' },
      ],
      { duration, easing: GROW },
    ),
    start.animate(
      swap.map((offset, i) => ({ offset, opacity: i < 2 ? 1 : 0 })),
      { duration },
    ),
    end.animate(
      swap.map((offset, i) => ({ offset, opacity: i < 2 ? 0 : 1 })),
      { duration },
    ),
  ];
}

/**
 * A case opens over the page, as a page of its own: its address in the bar,
 * back and forward in the browser, its own scroll — and a reload lands on
 * its standalone page (app/cases). Nothing under it moves or reloads, so
 * going back finds the page exactly as it was left.
 *
 * There is no copy of the card in the case: the card itself becomes the
 * page. Its contents melt into a blur, its grey surface grows to the whole
 * screen and turns the page's colour, and the case comes out of the blur on
 * it. The way back folds the page into the same card.
 */
export function CaseLayer() {
  const { setPaused } = useSmoothScroll();
  const [opened, setOpened] = useState<Opened | null>(null);
  const openedRef = useRef<Opened | null>(null);
  const closing = useRef(false);
  const leaving = useRef(false);
  const seq = useRef(0);
  const running = useRef<Animation[]>([]);
  const melted = useRef<Animation[]>([]);
  const headerFade = useRef<Animation[]>([]);
  const openTimers = useRef<number[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  const begin = useCallback((id: string, card: HTMLElement | null) => {
    if (openedRef.current || !CASES[id]) return;
    const o = { id, card, seq: ++seq.current };
    openedRef.current = o;
    setOpened(o);
  }, []);

  // The way out, once the address has gone back (or straight away).
  const close = useCallback(() => {
    const o = openedRef.current;
    const root = rootRef.current;
    const surface = surfaceRef.current;
    if (!o || !root || !surface || closing.current) return;
    closing.current = true;
    const finish = () => {
      openedRef.current = null;
      closing.current = false;
      setOpened(null);
      // A forward pressed while it was closing: the address is the case's
      // again, so it opens again.
      const again = caseByPath(window.location.pathname);
      if (again && ours(window.history.state, again.id)) {
        requestAnimationFrame(() =>
          begin(again.id, document.querySelector<HTMLElement>(`#works [data-case="${again.id}"]`)),
        );
      }
    };
    // A close can come while the way in is still running: everything sets
    // off back from wherever it has got to, never from the end of the way in.
    const card = o.card?.isConnected ? o.card : null;
    const fly = flyRef.current;
    const back = barRef.current?.querySelector<HTMLElement>('.cp-back');
    const barTitle = barRef.current?.querySelector<HTMLElement>('.cp-bar__title');
    const cardTitle = card?.querySelector<HTMLElement>('.cs-card__title');
    const parts = cardParts(card);
    const now = (el: Element | null | undefined) => (el ? getComputedStyle(el) : null);
    const surfaceNow = now(surface)!;
    const was = {
      clipPath: surfaceNow.clipPath === 'none' ? FULL : surfaceNow.clipPath,
      backgroundColor: surfaceNow.backgroundColor,
      opacity: surfaceNow.opacity,
      fly: fly && now(fly)?.visibility === 'visible' ? fly.getBoundingClientRect() : null,
      back: now(back)?.opacity ?? '1',
      title: now(barTitle)?.opacity ?? '1',
      header: now(document.querySelector('.site-header'))?.opacity ?? '0',
      parts: parts.map((el) => {
        const cs = getComputedStyle(el);
        return {
          opacity: cs.opacity,
          filter: cs.filter === 'none' ? 'blur(0px)' : cs.filter,
          scale: cs.scale === 'none' ? '1' : cs.scale,
        };
      }),
    };
    openTimers.current.forEach((t) => window.clearTimeout(t));
    openTimers.current = [];
    running.current.forEach((a) => a.cancel());
    running.current = [];
    melted.current.forEach((a) => a.cancel());
    melted.current = [];
    surface.style.opacity = was.opacity;
    // Nothing takes the pointer or the wheel while it goes, and the case's
    // own glide stops where it is.
    root.style.pointerEvents = 'none';
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(lenis.animatedScroll, { immediate: true, force: true });

    card
      ?.querySelector('video')
      ?.play()
      .catch(() => {});
    const out = (el: Element | null | undefined, frames: Keyframe[], opts: KeyframeAnimationOptions) =>
      el?.animate(frames, { fill: 'forwards', ...opts });
    let done: Animation | undefined;

    if (reducedMotion()) {
      if (cardTitle) cardTitle.style.opacity = '';
      done = out(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease' });
    } else {
      // The case melts away first.
      out(
        scrollRef.current,
        [
          { opacity: 1, filter: 'blur(0px)', scale: '1' },
          { opacity: 0, filter: 'blur(6px)', scale: String(SINK) },
        ],
        { duration: OUT.melt, easing: LEAVE },
      );
      // The bar is glass: a filter on it would empty its backdrop, so its
      // parts only fade.
      out(back, [{ opacity: was.back }, { opacity: 0 }], { duration: OUT.melt, easing: LEAVE });
      out(barRef.current?.querySelector('.cp-bar__glass'), [{ opacity: 1 }, { opacity: 0 }], {
        duration: OUT.melt,
        easing: LEAVE,
      });
      const box = cardBox(card, root);
      // The name flies back into the card — from the bar, or from wherever
      // it was still on its way up — landing as the card does, where the
      // card's own title takes over from it.
      const from =
        was.fly ??
        (barTitle && Number(was.title) > 0.5 && onScreen(barTitle) ? barTitle.getBoundingClientRect() : null);
      if (box && fly && from && cardTitle) {
        const [flight] = flyTitle(
          fly,
          { rect: from, text: barTitle?.textContent ?? null },
          cardTitle,
          root,
          OUT.foldAt + OUT.fold,
        );
        if (barTitle) barTitle.style.visibility = 'hidden';
        flight.finished.then(
          () => {
            cardTitle.style.opacity = '';
          },
          () => {},
        );
      } else {
        if (cardTitle) cardTitle.style.opacity = '';
        out(barTitle, [{ opacity: was.title }, { opacity: 0 }], { duration: OUT.melt, easing: LEAVE });
      }
      // The site's header comes back where the bar was, once the bar has
      // gone.
      headerFade.current.forEach((a) => a.cancel());
      headerFade.current = Array.from(document.querySelectorAll('.site-header'), (h) =>
        h.animate([{ opacity: was.header }, { opacity: 1 }], {
          duration: 280,
          delay: Number(was.header) > 0.5 ? 0 : OUT.melt,
          easing: 'ease-out',
          fill: 'backwards',
        }),
      );
      if (box && card) {
        // Then the page folds back into the card...
        const grey = getComputedStyle(card).backgroundColor;
        out(
          surface,
          [
            { clipPath: was.clipPath, backgroundColor: was.backgroundColor },
            { clipPath: inset(box), backgroundColor: grey },
          ],
          { duration: OUT.fold, delay: OUT.foldAt, easing: GROW, fill: 'both' },
        );
        // ...lets go of it as it lands, and the card's contents come back
        // out of the blur underneath, from however melted they had got.
        out(surface, [{ opacity: was.opacity }, { opacity: 0 }], {
          duration: OUT.release,
          delay: OUT.releaseAt,
          easing: 'ease-in-out',
        });
        melted.current = parts.map((el, i) =>
          el.animate([was.parts[i], { opacity: 1, filter: 'blur(0px)', scale: '1' }], {
            duration: OUT.settle,
            delay: OUT.settleAt,
            easing: SETTLE,
            fill: 'backwards',
          }),
        );
        // Done once the surface has both landed and let go, and the name is
        // home.
        done = surface.animate([{}, {}], { duration: Math.max(OUT.foldAt + OUT.fold, OUT.releaseAt + OUT.release) });
      } else {
        // No card to fold into: the page just lets go, and the card (if it
        // had melted at all) comes back where it is.
        melted.current = parts.map((el, i) =>
          el.animate([was.parts[i], { opacity: 1, filter: 'blur(0px)', scale: '1' }], {
            duration: OUT.settle,
            easing: SETTLE,
          }),
        );
        done = out(surface, [{ opacity: was.opacity }, { opacity: 0 }], {
          duration: 360,
          delay: OUT.foldAt,
          easing: 'ease',
        });
      }
    }
    if (done) done.finished.then(finish, finish);
    else finish();
  }, [begin]);

  // Back, the bar's button, the end of the case, Escape: the browser's own
  // back where the case put itself in the history, so its forward still works.
  const requestClose = useCallback(() => {
    const o = openedRef.current;
    if (!o || closing.current || leaving.current) return;
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
        window.history.pushState({ case: id, layer: LAYER }, '', href);
        begin(id, card);
      }),
    [begin],
  );

  // Back and forward through the case's entry.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      leaving.current = false;
      const item = caseByPath(window.location.pathname);
      const o = openedRef.current;
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

  // The way in. Laid out but not yet painted, so the first frame is still
  // the page as it was, with the card in its place.
  useLayoutEffect(() => {
    if (!opened) return;
    const root = rootRef.current;
    const surface = surfaceRef.current;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!root || !surface || !scroller || !content) return;
    const html = document.documentElement;
    const reduced = reducedMotion();
    const card = opened.card?.isConnected ? opened.card : null;
    const pageVideo = card?.querySelector('video') ?? null;

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
    let flownTitle: HTMLElement | null = null;

    // The case's blocks wait under the hold (useReveal) until the surface is
    // most of the way out, then come out of the blur in turn.
    const release = () => root.removeAttribute('data-hold');
    const anims: Animation[] = [];
    let cancelGo = () => {};
    const add = (el: Element | null | undefined, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      const a = el?.animate(frames, opts);
      if (a) anims.push(a);
      return a;
    };

    if (reduced) {
      release();
      add(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease', fill: 'backwards' });
    } else {
      const box = cardBox(card, root);
      const page = getComputedStyle(surface).backgroundColor;
      if (box && card) {
        // The card's contents melt into a blur, where they are.
        melted.current = cardParts(card).map((el) =>
          el.animate(
            [
              { opacity: 1, filter: 'blur(0px)', scale: '1' },
              { opacity: 0, filter: `blur(${BLUR}px)`, scale: String(SWELL) },
            ],
            { duration: IN.melt, easing: LEAVE, fill: 'forwards' },
          ),
        );
        // Its surface takes over from the card's own grey — the same colour
        // in the same place, so the hand-over doesn't show — and grows.
        const grey = getComputedStyle(card).backgroundColor;
        add(surface, [{ opacity: 0 }, { opacity: 1 }], {
          duration: IN.surfaceFade,
          delay: IN.surfaceAt,
          easing: 'linear',
          fill: 'backwards',
        });
        add(
          surface,
          [
            { clipPath: inset(box), backgroundColor: grey },
            { clipPath: FULL, backgroundColor: page },
          ],
          { duration: IN.grow, delay: IN.surfaceAt, easing: GROW, fill: 'backwards' },
        );
      } else {
        // No card to grow out of (reopened with the page elsewhere): the
        // page simply arrives.
        add(surface, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease', fill: 'backwards' });
      }
      // The bar is glass: its button scales in from a touch smaller rather
      // than out of a blur, which would empty its backdrop. Its title is the
      // card's, flown up from the card where there was one to fly from.
      const back = barRef.current?.querySelector<HTMLElement>('.cp-back');
      const barTitle = barRef.current?.querySelector<HTMLElement>('.cp-bar__title');
      const cardTitle = card?.querySelector<HTMLElement>('.cs-card__title');
      const fly = flyRef.current;
      const arrive = (el: HTMLElement | null | undefined, delay: number) =>
        add(
          el,
          [
            { opacity: 0, scale: '0.96' },
            { opacity: 1, scale: '1' },
          ],
          { duration: 420, delay, easing: SETTLE, fill: 'backwards' },
        );
      arrive(back, IN.contentAt + 40);
      // The site's header steps aside at once, so the name flies up into an
      // empty top and lands where the header was.
      headerFade.current = Array.from(document.querySelectorAll('.site-header'), (h) =>
        h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out', fill: 'forwards' }),
      );
      if (box && fly && barTitle && onScreen(cardTitle) && cardSeen(card)) {
        flownTitle = cardTitle;
        cardTitle.style.opacity = '0';
        anims.push(
          ...flyTitle(
            fly,
            { rect: cardTitle.getBoundingClientRect(), text: cardTitle.textContent },
            barTitle,
            root,
            IN.grow,
          ),
        );
        // The bar's own title waits under it and takes over as it lands.
        add(barTitle, [{ opacity: 0 }, { opacity: 0 }], { duration: IN.grow });
      } else {
        arrive(barTitle, IN.contentAt + 40);
      }
      // Everything waits for the case's first frame to be on screen: laying
      // the case out the first time is the heaviest moment of the way in,
      // and an animation started under it would have run its first frames
      // unseen. Held at their first frame, they all set off together.
      const held = [...anims, ...melted.current, ...headerFade.current];
      held.forEach((a) => a.pause());
      let go = requestAnimationFrame(() => {
        go = requestAnimationFrame(() => {
          if (closing.current) return; // closed before it set off: nothing to start
          held.forEach((a) => a.play());
          openTimers.current.push(
            window.setTimeout(release, IN.contentAt),
            // The card's video has nothing to show while the case is over it.
            window.setTimeout(() => pageVideo?.pause(), IN.melt),
          );
        });
      });
      cancelGo = () => cancelAnimationFrame(go);
    }
    running.current = anims;
    Promise.all(anims.map((a) => a.finished)).then(
      () => {
        if (running.current === anims) running.current = [];
      },
      () => {},
    );

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
    // Page Down, Space) from the start; the first Tab goes up to the bar's
    // back button, as the bar comes first.
    scroller.focus({ preventScroll: true });
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.shiftKey || e.target !== scroller) return;
      const backButton = barRef.current?.querySelector<HTMLElement>('.cp-back');
      if (!backButton) return;
      e.preventDefault();
      backButton.focus();
    };
    scroller.addEventListener('keydown', onTab);

    return () => {
      scroller.removeEventListener('keydown', onTab);
      cancelGo();
      openTimers.current.forEach((t) => window.clearTimeout(t));
      openTimers.current = [];
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenisRef.current = null;
      html.style.overflow = '';
      html.removeAttribute('data-case-open');
      setPaused(false);
      inert.forEach((el) => el.removeAttribute('inert'));
      document.title = title;
      if (flownTitle) flownTitle.style.opacity = '';
      // Unless a close has already brought the header back.
      headerFade.current.forEach((a) => {
        if (a.effect?.getTiming().fill === 'forwards') a.cancel();
      });
      // The card's contents are whole again once their way back is done
      // (or at once, if the case went without one).
      const back = melted.current;
      melted.current = [];
      back.forEach((a) => {
        if (a.playState === 'finished' || a.effect?.getTiming().fill === 'forwards') a.cancel();
        else
          a.finished.then(
            () => a.cancel(),
            () => {},
          );
      });
      if (card) {
        pageVideo?.play().catch(() => {});
        card.querySelector<HTMLElement>('.cs-card__link')?.focus({ preventScroll: true });
      }
    };
  }, [opened, setPaused]);

  if (!opened) return null;
  const entry = CASES[opened.id];
  if (!entry) return null;
  const { Article } = entry;

  return createPortal(
    <div
      key={opened.seq}
      ref={rootRef}
      className="cp"
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.title} case study`}
      data-hold=""
    >
      <div ref={surfaceRef} className="cp__surface" />
      {/* First in the tab order, though drawn over the case. */}
      <CaseBar ref={barRef} title={entry.title} onBack={requestClose} scrollerRef={scrollRef} />
      {/* data-lenis-prevent: the page's smooth scroll leaves this wheel alone;
          the case's own instance runs it. */}
      <div ref={scrollRef} className="cp__scroll" data-lenis-prevent tabIndex={-1}>
        <div ref={contentRef} className="cp__content">
          <Article onBack={requestClose} />
        </div>
      </div>
      <div ref={flyRef} className="cp-fly" aria-hidden="true" />
    </div>,
    document.body,
  );
}
