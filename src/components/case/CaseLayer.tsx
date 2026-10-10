'use client';

import Lenis from 'lenis';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { showcase } from '@/data/showcase';
import { CaseCard } from '@/components/showcase/CaseCard';
import { useSmoothScroll } from '@/components/providers/SmoothScrollProvider';
import { zoomOf } from '@/lib/zoom';
import { CaseBar } from './CaseBar';
import { CASES } from './registry';
import { CASE_RETURN_EVENT, onOpenCase, type CaseReturn } from './caseStore';
import './case.css';

// The page's own easing (the cards' notes, the header): quick out of the
// gate, a long soft landing.
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const GLIDE_IN = 760;
const GLIDE_OUT = 640;
// Under this much of the case's card on screen, a close doesn't glide it
// back from off the screen: the case sinks away instead.
const MIN_VISIBLE = 80;

type Opened = { id: string; card: HTMLElement | null; note: number; seq: number };
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

/**
 * A case opens over the page, as a page of its own: its address in the bar,
 * back and forward in the browser, its own scroll — and a reload lands on
 * its standalone page (app/cases). Nothing under it moves or reloads, so
 * going back finds the page exactly as it was left.
 *
 * The way in is the card itself: the case starts with a copy of it, which
 * sets off from where the card is and glides into place while the page
 * fades out under it — same video, same frame, same note. The way out is
 * the same glide backwards, when the card is still in view.
 */
export function CaseLayer() {
  const { setPaused } = useSmoothScroll();
  const [opened, setOpened] = useState<Opened | null>(null);
  const openedRef = useRef<Opened | null>(null);
  const closing = useRef(false);
  const started = useRef(false);
  const leaving = useRef(false);
  const seq = useRef(0);
  const running = useRef<Animation[]>([]);
  const headerFade = useRef<Animation[]>([]);
  const lenisRef = useRef<Lenis | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const begin = useCallback((id: string, card: HTMLElement | null) => {
    if (openedRef.current || !CASES[id]) return;
    const note = Number(card?.querySelector<HTMLElement>('[data-note]')?.dataset.note) || 0;
    const o = { id, card, note, seq: ++seq.current };
    openedRef.current = o;
    setOpened(o);
  }, []);

  // The way out, once the address has gone back (or straight away).
  const close = useCallback(() => {
    const o = openedRef.current;
    const root = rootRef.current;
    const heroCard = heroRef.current?.querySelector<HTMLElement>('.cs-card');
    if (!o || !root || !heroCard || closing.current) return;
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
    // Closed before it had even come in (it waits on its pictures for a
    // moment): nothing to undo on screen.
    if (!started.current) {
      finish();
      return;
    }
    running.current.forEach((a) => a.finish());
    running.current = [];
    // Nothing takes the pointer or the wheel while it goes, and the case's
    // glide stops where it is.
    root.style.pointerEvents = 'none';
    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(lenis.animatedScroll, { immediate: true, force: true });

    const card = o.card?.isConnected ? o.card : null;
    // The card on the page takes over the copy's note and video frame, while
    // it is still hidden.
    const note = Number(heroCard.querySelector<HTMLElement>('[data-note]')?.dataset.note) || 0;
    window.dispatchEvent(new CustomEvent<CaseReturn>(CASE_RETURN_EVENT, { detail: { id: o.id, note } }));
    const from = heroCard.querySelector('video');
    const to = card?.querySelector('video');
    if (from && to && from.readyState >= 1) {
      try {
        to.currentTime = from.currentTime;
      } catch {}
      // Playing along under the copy, so the two are on one frame at the swap.
      to.play().catch(() => {});
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // The site's header comes back where the bar was, once the bar has gone.
    headerFade.current.forEach((a) => a.cancel());
    headerFade.current = reduced
      ? []
      : Array.from(document.querySelectorAll('.site-header'), (h) =>
          h.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 320,
            delay: 220,
            easing: 'ease-out',
            fill: 'backwards',
          }),
        );
    const hr = heroCard.getBoundingClientRect();
    const glide = !reduced && card && hr.bottom > MIN_VISIBLE && hr.top < window.innerHeight - MIN_VISIBLE;
    const out = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) =>
      el?.animate(frames, { fill: 'forwards', ...opts });
    let done: Animation | undefined;

    if (reduced) {
      done = out(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease' });
    } else if (glide && card) {
      const target = card.getBoundingClientRect();
      const z = zoomOf(heroCard);
      // Scaled about its top edge's middle (showcase.css: transform-origin).
      const dx = (target.left + target.width / 2 - hr.left - hr.width / 2) / z;
      const dy = (target.top - hr.top) / z;
      const s = target.width / hr.width;
      done = out(
        heroCard,
        [
          { transform: 'none', filter: 'none', opacity: 1 },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${s})`,
            filter: card.style.filter || 'none',
            opacity: card.style.opacity || 1,
          },
        ],
        { duration: GLIDE_OUT, easing: EASE },
      );
      out(bodyRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' });
      out(barRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' });
      out(backdropRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 440, delay: 140, easing: 'ease-in-out' });
    } else {
      // The card is far from view: the case sinks away and the page comes
      // back under it, the card fading back into its place.
      out(
        contentRef.current,
        [
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(48px)' },
        ],
        {
          duration: 380,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
        },
      );
      out(barRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out' });
      done = out(backdropRef.current, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 460,
        delay: 160,
        easing: 'ease-in-out',
      });
      if (card) {
        card.style.visibility = '';
        card.animate([{ opacity: 0 }, { opacity: card.style.opacity || 1 }], {
          duration: 460,
          delay: 160,
          easing: 'ease-out',
          fill: 'backwards',
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

  // The way in. Laid out but not yet painted: everything starts from where
  // the card is, so the first frame is the page as it was.
  useLayoutEffect(() => {
    if (!opened) return;
    const root = rootRef.current;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    const heroCard = heroRef.current?.querySelector<HTMLElement>('.cs-card');
    if (!root || !scroller || !content || !heroCard) return;
    const html = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const card = opened.card?.isConnected ? opened.card : null;
    started.current = false;

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

    // The copy stands in for the card — once its pictures (the phone's
    // frame) are decoded, or it would show up for a frame without them. A
    // wait of a frame or two at most; meanwhile the page is simply as it was.
    const pageVideo = card?.querySelector('video') ?? null;
    let dropShot = () => {};
    let cancelled = false;
    root.style.visibility = 'hidden';
    const start = () => {
      if (cancelled || closing.current) return;
      started.current = true;
      root.style.visibility = '';
      // Under a plain fade the card stays put beneath it: no hole.
      if (card && !reduced) {
        card.style.visibility = 'hidden';
        dropShot = handOver(pageVideo, heroCard.querySelector('video'));
        pageVideo?.pause();
      }

      const anims: Animation[] = [];
      const add = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
        const a = el?.animate(frames, { fill: 'backwards', ...opts });
        if (a) anims.push(a);
      };
      if (reduced) {
        add(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease' });
      } else {
        if (card) {
          const from = card.getBoundingClientRect();
          const to = heroCard.getBoundingClientRect();
          const z = zoomOf(heroCard);
          // Scaled about its top edge's middle (showcase.css: transform-origin).
          const dx = (from.left + from.width / 2 - to.left - to.width / 2) / z;
          const dy = (from.top - to.top) / z;
          add(
            heroCard,
            [
              {
                transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width})`,
                filter: card.style.filter || 'none',
                opacity: card.style.opacity || 1,
              },
              { transform: 'none', filter: 'none', opacity: 1 },
            ],
            { duration: GLIDE_IN, easing: EASE },
          );
        } else {
          add(
            heroRef.current,
            [
              { opacity: 0, transform: 'translateY(32px)' },
              { opacity: 1, transform: 'none' },
            ],
            {
              duration: GLIDE_IN,
              easing: EASE,
            },
          );
        }
        add(backdropRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 460, easing: 'ease-out' });
        add(
          bodyRef.current,
          [
            { opacity: 0, transform: 'translateY(40px)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 820,
            delay: 260,
            easing: EASE,
          },
        );
        add(
          barRef.current,
          [
            { opacity: 0, transform: 'translateY(-8px)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 520,
            delay: 220,
            easing: EASE,
          },
        );
        // The site's header steps aside before the bar comes in at its
        // place, so the two titles never show over each other.
        headerFade.current = Array.from(document.querySelectorAll('.site-header'), (h) =>
          h.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' }),
        );
      }
      running.current = anims;
      Promise.all(anims.map((a) => a.finished)).then(
        () => {
          if (running.current === anims) running.current = [];
        },
        () => {},
      );
      // Focus in the case's scroll, so the keyboard reads it down (arrows,
      // Page Down, Space) from the start.
      scroller.focus({ preventScroll: true });
    };
    const imgs = Array.from(heroCard.querySelectorAll('img'));
    imgs.forEach((img) => {
      img.loading = 'eager';
    });
    Promise.race([
      Promise.all(imgs.map((img) => img.decode().catch(() => {}))),
      new Promise((r) => window.setTimeout(r, 160)),
    ]).then(start);

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

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenisRef.current = null;
      dropShot();
      html.style.overflow = '';
      html.removeAttribute('data-case-open');
      setPaused(false);
      inert.forEach((el) => el.removeAttribute('inert'));
      document.title = title;
      // Unless a close has already brought the header back.
      headerFade.current.forEach((a) => {
        if (a.effect?.getTiming().fill === 'forwards') a.cancel();
      });
      if (card) {
        card.style.visibility = '';
        pageVideo?.play().catch(() => {});
        card.querySelector<HTMLElement>('.cs-card__link')?.focus({ preventScroll: true });
      }
    };
  }, [opened, setPaused]);

  if (!opened) return null;
  const item = showcase.find((s) => s.id === opened.id);
  const entry = CASES[opened.id];
  if (!item || !entry) return null;
  const { Article } = entry;

  return createPortal(
    <div
      key={opened.seq}
      ref={rootRef}
      className="cp"
      role="dialog"
      aria-modal="true"
      aria-label={`${entry.title} case study`}
    >
      <div ref={backdropRef} className="cp__backdrop" />
      {/* First in the tab order, though drawn over the case. */}
      <CaseBar ref={barRef} title={entry.title} onBack={requestClose} scrollerRef={scrollRef} />
      {/* data-lenis-prevent: the page's smooth scroll leaves this wheel alone;
          the case's own instance runs it. */}
      <div ref={scrollRef} className="cp__scroll" data-lenis-prevent tabIndex={-1}>
        <div ref={contentRef} className="cp__content">
          <div ref={heroRef} className="cs cp-hero">
            <CaseCard item={item} idPrefix="cp" home={false} titleAs="h1" noteStart={opened.note} />
          </div>
          <div ref={bodyRef}>
            <Article onBack={requestClose} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * The page's video and the copy's are two players: the copy starts on a
 * still of the frame the page was showing, seeks to that same frame, and the
 * still goes once the video shows it — so it carries on from exactly there
 * (a moment's pause while the card glides, never a jump). Returns the
 * clean-up.
 */
function handOver(from: HTMLVideoElement | null, to: HTMLVideoElement | null) {
  if (!from || !to || from.readyState < 2 || !from.videoWidth) return () => {};
  const shot = document.createElement('canvas');
  shot.width = from.videoWidth;
  shot.height = from.videoHeight;
  try {
    shot.getContext('2d')?.drawImage(from, 0, 0);
  } catch {
    return () => {};
  }
  shot.className = to.className;
  shot.style.cssText = to.style.cssText;
  shot.setAttribute('aria-hidden', 'true');
  to.after(shot);

  const at = from.currentTime;
  let timer = 0;
  const drop = () => {
    window.clearTimeout(timer);
    to.removeEventListener('loadedmetadata', seek);
    to.removeEventListener('seeked', shown);
    shot.remove();
  };
  const shown = () => {
    const v = to as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(drop);
    else requestAnimationFrame(drop);
  };
  function seek() {
    to!.addEventListener('seeked', shown, { once: true });
    try {
      to!.currentTime = at;
    } catch {
      drop();
    }
  }
  if (to.readyState >= 1) seek();
  else to.addEventListener('loadedmetadata', seek, { once: true });
  // Never leave the still up for long, whatever the network does.
  timer = window.setTimeout(drop, 2500);
  return drop;
}
