'use client';

import Lenis from 'lenis';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { showcase } from '@/data/showcase';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { zoomOf } from '@/lib/zoom';
import { CaseBar } from './CaseBar';
import { CaseScroll } from './blocks';
import { CASES } from './registry';
import { onOpenCase } from './caseStore';
import './case.css';

// The card's surface grows into the page on an emphasised curve: it
// gathers, moves, and lands long and soft. It folds back on a balanced one,
// so it lands briskly and the card fills again without a wait.
const GROW = 'cubic-bezier(0.2, 0, 0, 1)';
const FOLD_CURVE = [0.4, 0, 0.2, 1] as const;
const FOLD = `cubic-bezier(${FOLD_CURVE.join(', ')})`;
// Fades clear quickly and have no hard end; a hand-over between two layers
// eases in and out.
const FADE = 'cubic-bezier(0, 0, 0.2, 1)';
const SWAP = 'cubic-bezier(0.4, 0, 0.2, 1)';
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';

// The choreography, in ms. The card becomes the page, and its grey surface
// alone carries over: nothing travels on its own. In: the card's contents
// fade where they are, and the page around the card with them (the veil), so
// a bare card is left on a blank page; the surface takes over from the card,
// whole and at once (the same grey in the same place, so the hand-over
// doesn't show), and grows into the page, turning the page's colour as it
// goes, so it never stands as a screen of grey; the case comes in on it as
// one, as soon as it has all but turned, so there is no pause between the two.
const IN = { clear: 120, surfaceAt: 90, grow: 500, color: 300, contentAt: 260, barAt: 280, arrive: 320 };
// Out: the case fades, the veil lifts off the page around it, and the
// surface folds back into the card, turning the card's grey on the way. Once
// it has all but landed (within a pixel of the card, at 9/10 of the fold:
// settled = 436) it steps off it, unseen (same box, same grey), and the card
// fills again at once.
const OUT = { clear: 140, foldAt: 40, fold: 440, colorAt: 140, veilAt: 140, veil: 280, refill: 200 };
// Without a card to grow out of or fold into (it is off screen), the page
// fades in and out over the page where it is.
const BARE = { in: 240, contentAt: 160, barAt: 180, outAt: 60, out: 280 };

// The header's glass refracts only while nothing over it is translucent: a
// faded ancestor becomes its backdrop root, so the pill goes flat and its
// disc grey until the fade ends, then snaps back. So the header fades leaf by
// leaf — the glass layers themselves, and the blend layer (no glass in it)
// whole — each from and back to its own resting level.
const HEADER_LAYERS = '.site-header__glass, .lgm-button__disc, .lgm-chev, .site-header--blend';
// The bottom of the header's row, its glass and edge included (px).
const HEADER_ROW = 56;

type Opened = { id: string; card: HTMLElement | null; seq: number };
type CaseState = { case?: string; layer?: string } | null;
/** A box inside the layer, by its insets, with its top and bottom corners. */
type Rect = { top: number; right: number; bottom: number; left: number; radius: number; foot: number };

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
  // The next card slides over this one (the cards stack): only the part
  // above it is this card's to grow out of and fold back into, so the
  // surface never paints over a card in front of it. Cut off there, its
  // bottom corners are square: that edge is where the card goes under.
  const next = card.nextElementSibling;
  const seen = next?.classList.contains('cs-card') ? Math.min(r.bottom, next.getBoundingClientRect().top) : r.bottom;
  const z = zoomOf(layer);
  const w = layer.clientWidth;
  const h = layer.clientHeight;
  // The corner as drawn, scaled with the card when it is receding.
  const radius = (parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0) * (r.width / z / card.offsetWidth);
  const foot = seen < r.bottom ? 0 : radius;
  return { top: r.top / z, right: w - r.right / z, bottom: h - seen / z, left: r.left / z, radius, foot };
}

const inset = (b: Rect) =>
  `inset(${b.top}px ${b.right}px ${b.bottom}px ${b.left}px round ${b.radius}px ${b.radius}px ${b.foot}px ${b.foot}px)`;
const FULL = 'inset(0px 0px 0px 0px round 0px)';

/** The whole layer but the card, corners and all, for the veil: the page
    around the card can go blank while the card is still the page's own. */
function around(b: Rect, layer: HTMLElement) {
  const w = layer.clientWidth;
  const h = layer.clientHeight;
  const { top: t, left: l, radius: r, foot: f } = b;
  const right = w - b.right;
  const bottom = h - b.bottom;
  const card =
    `M${l + r} ${t}H${right - r}A${r} ${r} 0 0 1 ${right} ${t + r}V${bottom - f}` +
    `A${f} ${f} 0 0 1 ${right - f} ${bottom}H${l + f}A${f} ${f} 0 0 1 ${l} ${bottom - f}` +
    `V${t + r}A${r} ${r} 0 0 1 ${l + r} ${t}Z`;
  return `path(evenodd, "M0 0H${w}V${h}H0Z ${card}")`;
}

/** When, as a share of its time, the fold has gone a share p of its way:
    the easing curve's x where its y is p, found by halving (y only rises). */
function foldTimeAt(p: number) {
  const [x1, y1, x2, y2] = FOLD_CURVE;
  const at = (a: number, b: number, u: number) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const u = (lo + hi) / 2;
    if (at(y1, y2, u) < p) lo = u;
    else hi = u;
  }
  return at(x1, x2, (lo + hi) / 2);
}

/** What fades on the card: everything but its link, which draws nothing. */
const cardParts = (card: HTMLElement | null) =>
  card ? Array.from(card.children).filter((el) => !el.classList.contains('cs-card__link')) : [];

/**
 * A case opens over the page, as a page of its own: its address in the bar,
 * back and forward in the browser, its own scroll — and a reload lands on
 * its standalone page (app/cases). Nothing under it moves or reloads, so
 * going back finds the page exactly as it was left.
 *
 * There is no copy of the card in the case: the card itself becomes the
 * page. Its contents fade, its grey surface grows to the whole screen and
 * turns the page's colour, and the case comes in on it. The way back folds
 * the page into the same card, which fills again.
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
  const lenisRef = useRef<Lenis | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

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
    const bar = barRef.current;
    const row = bar?.querySelector<HTMLElement>('.cp-bar__row');
    const veil = veilRef.current;
    const scroller = scrollRef.current;
    const parts = cardParts(card);
    const headerLayers = Array.from(document.querySelectorAll(HEADER_LAYERS));
    const now = (el: Element | null | undefined) => (el ? getComputedStyle(el) : null);
    const surfaceNow = now(surface)!;
    const was = {
      clipPath: surfaceNow.clipPath === 'none' ? FULL : surfaceNow.clipPath,
      backgroundColor: surfaceNow.backgroundColor,
      opacity: surfaceNow.opacity,
      row: now(row)?.opacity ?? '1',
      rowScale: now(row)?.scale ?? 'none',
      bar: now(bar)?.opacity ?? '1',
      scroll: now(scroller)?.opacity ?? '1',
      veil: now(veil)?.opacity ?? '1',
      header: headerLayers.map((el) => getComputedStyle(el).opacity),
      parts: parts.map((el) => getComputedStyle(el).opacity),
    };
    running.current.forEach((a) => a.cancel());
    running.current = [];
    melted.current.forEach((a) => a.cancel());
    melted.current = [];
    // Whatever the way in had got to stays as it is, written in, so nothing
    // jumps as its animations go.
    surface.style.opacity = was.opacity;
    if (veil) veil.style.opacity = was.veil;
    if (row) {
      row.style.opacity = was.row;
      row.style.scale = was.rowScale;
    }
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
    // The site's header comes back where the bar was: each of its layers
    // from where it had got to, to its own resting level.
    const headerBack = (delay: number, duration: number, easing = 'ease-out') => {
      headerFade.current.forEach((a) => a.cancel());
      headerFade.current = headerLayers.map((el, i) =>
        el.animate([{ opacity: was.header[i], offset: 0 }], { duration, delay, easing, fill: 'backwards' }),
      );
    };
    let done: Animation | undefined;

    if (reducedMotion()) {
      done = out(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease' });
    } else {
      // The case fades first, the whole bar with it.
      out(scroller, [{ opacity: was.scroll }, { opacity: 0 }], { duration: OUT.clear, easing: FADE });
      out(bar, [{ opacity: was.bar }, { opacity: 0 }], { duration: OUT.clear, easing: FADE });
      const box = cardBox(card, root);
      // The veil lifts off the page around the card, the card cut out of it
      // where it is now (where it was, unless the window changed size while
      // the case was open). With no card to fold into it is whole, so the
      // page comes back evenly under the surface as the two fade together.
      if (veil) veil.style.clipPath = box ? around(box, root) : '';
      if (box && card && Number(was.opacity) > 0.5) {
        // Then the page folds back into the card, turning its grey, while
        // the page comes back around it...
        const settled = OUT.foldAt + Math.round(OUT.fold * 0.9);
        out(surface, [{ clipPath: was.clipPath }, { clipPath: inset(box) }], {
          duration: OUT.fold,
          delay: OUT.foldAt,
          easing: FOLD,
          fill: 'both',
        });
        out(
          surface,
          [{ backgroundColor: was.backgroundColor }, { backgroundColor: getComputedStyle(card).backgroundColor }],
          { duration: settled - OUT.colorAt, delay: OUT.colorAt, easing: SWAP, fill: 'both' },
        );
        out(veil, [{ opacity: was.veil }, { opacity: 0 }], {
          duration: OUT.veil,
          delay: OUT.veilAt,
          easing: FADE,
          fill: 'both',
        });
        // ...all but lands on it and steps off it, unseen: the card under it
        // is the same grey in the same place. Then it fills again at once.
        out(surface, [{ opacity: 0 }, { opacity: 0 }], { duration: OUT.refill, delay: settled });
        melted.current = parts.map((el, i) =>
          el.animate([{ opacity: was.parts[i] }, { opacity: 1 }], {
            duration: OUT.refill,
            delay: settled,
            easing: FADE,
            fill: 'backwards',
          }),
        );
        // The header is under the veil and comes back as it lifts, but only
        // once the surface's top edge, folding down, has cleared the header's
        // row: before that the edge would cut through it. Where the card
        // itself is under the row (on a phone its title sits under the pill),
        // the header waits until the card has filled. Over a veil that was
        // already thinning (closed on the way in) it fades in with it.
        const fromTop = parseFloat(was.clipPath.slice('inset('.length)) || 0;
        const cleared = OUT.foldAt + OUT.fold * foldTimeAt((HEADER_ROW - fromTop) / (box.top - fromTop));
        const clear = fromTop >= HEADER_ROW ? OUT.veilAt : Math.max(OUT.veilAt, cleared);
        const lifted = OUT.veilAt + OUT.veil;
        if (window.matchMedia('(max-width: 899px)').matches || box.top < HEADER_ROW) headerBack(settled + 120, 240);
        else if (Number(was.veil) > 0.95) headerBack(clear, Math.max(lifted - clear, 160));
        else headerBack(OUT.veilAt, OUT.veil);
        done = surface.animate([{}, {}], { duration: settled + OUT.refill });
      } else if (box && card) {
        // Closed before the surface had taken over: the card is still there
        // under it, and its contents just come back in.
        melted.current = parts.map((el, i) =>
          el.animate([{ opacity: was.parts[i] }, { opacity: 1 }], { duration: OUT.refill, easing: FADE }),
        );
        out(veil, [{ opacity: was.veil }, { opacity: 0 }], { duration: 160, easing: FADE });
        headerBack(0, OUT.refill);
        done = surface.animate([{}, {}], { duration: OUT.refill });
      } else {
        // No card to fold into: the page just lets go, and the card (if it
        // had faded at all) comes back where it is.
        melted.current = parts.map((el, i) =>
          el.animate([{ opacity: was.parts[i] }, { opacity: 1 }], { duration: OUT.refill, easing: FADE }),
        );
        const away = { duration: BARE.out, delay: BARE.outAt, easing: 'ease' };
        out(surface, [{ opacity: was.opacity }, { opacity: 0 }], away);
        out(veil, [{ opacity: was.veil }, { opacity: 0 }], away);
        headerBack(BARE.outAt, OUT.veil);
        done = surface.animate([{}, {}], { duration: BARE.outAt + BARE.out });
      }
    }
    if (done) done.finished.then(finish, finish);
    else finish();
  }, [begin]);

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
    }),
    [],
  );

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

    // The case's blocks wait under the hold (useReveal) until the surface has
    // all but turned the page's colour, then the first screen comes in as one.
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
      const veil = veilRef.current;
      let contentAt = IN.contentAt;
      let barAt = IN.barAt;
      if (box && card) {
        // The card's contents fade, where they are, its title with them.
        melted.current = cardParts(card).map((el) =>
          el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: IN.clear, easing: FADE, fill: 'forwards' }),
        );
        // And the page around the card with them, in the same time on the
        // same curve: no header, no edge of the next card is left to linger
        // beside the card as it grows. The veil leaves the card itself alone,
        // as the surface hasn't taken it over yet.
        if (veil) veil.style.clipPath = around(box, root);
        add(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: IN.clear, easing: FADE, fill: 'backwards' });
        // Its surface takes over from the card, whole and at once, once the
        // card is all but bare — the same grey in the same place, so the
        // hand-over doesn't show — and grows.
        const grey = getComputedStyle(card).backgroundColor;
        add(surface, [{ opacity: 0 }, { opacity: 1 }], {
          duration: IN.surfaceAt,
          easing: 'step-end',
          fill: 'backwards',
        });
        add(surface, [{ clipPath: inset(box) }, { clipPath: FULL }], {
          duration: IN.grow,
          delay: IN.surfaceAt,
          easing: GROW,
          fill: 'backwards',
        });
        // The colour turns with the growth, on its curve but in less time:
        // the surface lightens as it moves, so it never stands as a screen
        // of grey, its edge has all but gone by the time it nears the
        // screen's, and the case comes in on the page's final colour rather
        // than through a grey fog.
        add(surface, [{ backgroundColor: grey }, { backgroundColor: page }], {
          duration: IN.color,
          delay: IN.surfaceAt,
          easing: GROW,
          fill: 'backwards',
        });
      } else {
        // No card to grow out of (reopened with the page elsewhere): the
        // page simply arrives.
        add(surface, [{ opacity: 0 }, { opacity: 1 }], { duration: BARE.in, easing: 'ease', fill: 'backwards' });
        add(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: BARE.in, easing: 'ease', fill: 'backwards' });
        contentAt = BARE.contentAt;
        barAt = BARE.barAt;
      }
      // The bar's back button and title arrive as one, from a touch smaller.
      add(
        barRef.current?.querySelector('.cp-bar__row'),
        [
          { opacity: 0, scale: '0.96' },
          { opacity: 1, scale: '1' },
        ],
        { duration: IN.arrive, delay: barAt, easing: SETTLE, fill: 'backwards' },
      );
      // The site's header steps aside with the card's contents, each layer
      // from its own resting level (a pill that isn't shown stays unshown).
      headerFade.current = Array.from(document.querySelectorAll(HEADER_LAYERS), (el) =>
        el.animate([{ opacity: 0 }], { duration: IN.clear, easing: FADE, fill: 'forwards' }),
      );
      // The content's go, and the card's video stopping (it has nothing to
      // show while the case is over it), are timed on the animations' own
      // clock: they only get their start time on the frame after play(),
      // which on a first open can land well after a timer would have run.
      add(surface, [{}, {}], { duration: contentAt })?.finished.then(release, () => {});
      add(surface, [{}, {}], { duration: IN.clear })?.finished.then(
        () => pageVideo?.pause(),
        () => {},
      );
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
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenisRef.current = null;
      html.style.overflow = '';
      html.removeAttribute('data-case-open');
      setPaused(false);
      inert.forEach((el) => el.removeAttribute('inert'));
      document.title = title;
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
      <div ref={veilRef} className="cp__veil" />
      <div ref={surfaceRef} className="cp__surface" />
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
