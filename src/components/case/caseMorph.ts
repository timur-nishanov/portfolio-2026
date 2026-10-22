import { lerp } from '@/lib/lerp';
import { stepSpring, type SpringConfig, type SpringState } from '@/lib/spring';
import { zoomOf } from '@/lib/zoom';
import { glassDrop, glassEdge } from '@/components/header/menu/glassMaterial';
import { clamp01, smoothstep, springOf } from '@/components/header/menu/liquid';
import { CHIP, chipPlace, dockChip } from '@/components/showcase/chipPlace';

/**
 * The way into a case and back out of it (CaseLayer), as the menu grows out
 * of its button and folds back into it (useLiquidMorph). Clicked with the
 * "Case study" chip under the pointer, the chip swells into the page: its
 * glass leaves the pointer as a drop, clears into the page's paper as it
 * spreads, and the case's first screen comes in once the paper has most of
 * the screen, block after block, as the blocks further down come in on a
 * scroll (useReveal). Closing runs the same way back: the words go, the page
 * draws in, turns to glass again and lands as the chip: where the chip will
 * be, if the pointer is over the card (and the chip takes its place there),
 * else where it came out of, and goes as the chip goes. Tapped, or opened
 * from the keyboard, the card is the seed both ways.
 *
 * What moves is cheap to move: the layer (.cp) is drawn once, whole, and only
 * its clip and its opacity change per frame; the drop is a small box of its
 * own, there only while the shape is small. Each edge runs its own spring,
 * written straight to the styles, so React never renders a frame of it, and
 * a close called mid-way turns back from where the shape is.
 */

type Edge = 'top' | 'right' | 'bottom' | 'left';
const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];
type Box = Record<Edge, number>;

export type MorphSeed = {
  /** 'pill': the chip (glass, its words); 'card': the card. */
  kind: 'pill' | 'card';
  /** Where it is, in the layer's own px (the body's zoom divided out). */
  box: Box;
  /** Its corners, CSS px. */
  radius: number;
  /** The chip's glass as drawn (hover and engine included). */
  tint?: string;
  label?: string;
  /** Closing into the chip that is about to show under the pointer: hands
      its place over to it at the landing (false if no chip took it). */
  dock?: () => boolean;
};

export type Pointer = { x: number; y: number; mouse: boolean; inside: boolean };

// Calm, as the page is: a soft spread, the sides a touch ahead of the top
// and bottom, so the drop leaves the pointer wide, as the chip is, and
// rounds into the page rather than ballooning. A little under critical:
// near critical the last few pixels at the screen's edges crawled in for
// half a second; this way each edge runs on past the screen's (by about a
// hundredth of its way, out of sight) and is there in ~0.45 s.
const OPEN: Record<Edge, SpringConfig> = {
  top: springOf(0.66, 0.84),
  right: springOf(0.62, 0.82),
  bottom: springOf(0.66, 0.84),
  left: springOf(0.62, 0.82),
};
// The way back is a little quicker, the sides first, and every edge stops
// dead where it lands (as the menu's do on the button) instead of running on
// into the chip or the card: brisk, with no tail and no wobble (~0.3 s).
const CLOSE: Record<Edge, SpringConfig> = {
  top: springOf(0.5, 0.8),
  right: springOf(0.46, 0.8),
  bottom: springOf(0.5, 0.8),
  left: springOf(0.46, 0.8),
};
// No seed to grow from (the card off screen): a plain fade, both ways.
const FADE = springOf(0.32, 1);

// The corners on the way: the cards' and the menu panel's 24px, squared off
// as the shape meets the screen's edges (within RADIUS / SQUARE px of them).
const RADIUS = 24;
const SQUARE = 1.2;
// The first screen comes in once the shape is this far grown (0 seed, 1 the
// screen), and the paper is solid by then: out of a card a little sooner,
// as the card's face is all but gone into the paper already.
const REVEAL_AT = { pill: 0.5, card: 0.4, fade: 0.5 };
// At rest: every edge within a quarter pixel of where it is going, and slow.
const REST_PX = 0.25;
const REST_SPEED = 4;
// The drop, landed as the chip with no chip to take over, goes as the chip
// goes (showcase.css): faded and shrunk towards its top left.
const LEAVE_MS = 320;

const boxOf = (r: DOMRect, z: number): Box => ({
  top: r.top / z,
  right: r.right / z,
  bottom: r.bottom / z,
  left: r.left / z,
});
const onScreen = (r: DOMRect) =>
  r.width >= 1 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;

/**
 * Where a case asked for from this card grows from: the chip, while it is
 * there to be seen under the pointer; else the card, while any of it is on
 * screen; else nothing (a fade).
 */
export function seedFrom(card: HTMLElement | null): MorphSeed | null {
  if (!card?.isConnected) return null;
  const z = zoomOf(card);
  const chip = card.querySelector<HTMLElement>('.cs-chip');
  const pill = chip?.querySelector<HTMLElement>('.cs-chip__pill');
  if (chip && pill && chip.hasAttribute('data-on') && !chip.hasAttribute('data-aside')) {
    const cs = getComputedStyle(pill);
    if (cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.6) {
      const r = pill.getBoundingClientRect();
      return {
        kind: 'pill',
        box: boxOf(r, z),
        radius: r.height / 2 / z,
        tint: cs.backgroundColor,
        label: pill.textContent ?? '',
      };
    }
  }
  const r = card.getBoundingClientRect();
  if (!onScreen(r)) return null;
  return { kind: 'card', box: boxOf(r, z), radius: parseFloat(getComputedStyle(card).borderTopLeftRadius) || RADIUS };
}

/**
 * Where a case goes back to, closing: into the chip where it is about to
 * show, the mouse resting over the card (it takes over at the landing);
 * else, opened out of the chip, back into the chip where it was; else into
 * the card, while it is on screen; else nothing (a fade).
 */
export function closeTo(card: HTMLElement | null, opened: MorphSeed | null, pointer: Pointer | null): MorphSeed | null {
  if (!card?.isConnected) return null;
  const pill = card.querySelector<HTMLElement>('.cs-chip__pill');
  if (pill && pointer?.mouse && pointer.inside) {
    const r = card.getBoundingClientRect();
    if (pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom) {
      const at = chipPlace(card, pointer.x, pointer.y);
      if (!at.aside) {
        return {
          kind: 'pill',
          box: at.box,
          radius: CHIP.height / 2,
          tint: opened?.tint ?? getComputedStyle(pill).backgroundColor,
          label: pill.textContent ?? opened?.label ?? '',
          dock: () => dockChip(card, pointer.x, pointer.y),
        };
      }
    }
  }
  if (opened?.kind === 'pill') return { ...opened, dock: undefined };
  return seedFrom(card);
}

export type CaseMorph = {
  /** Grows the layer out of the seed (or fades it in). Drawn at once, so
      the first frame the browser paints is the seed itself; settled is
      called once the layer is the page. */
  open(seed: MorphSeed | null, settled?: () => void): void;
  /** Runs the layer back into the chip or the card (or fades it out), then
      calls done. False when there is nothing to animate (the caller drops
      it at once). */
  close(to: MorphSeed | null, done: () => void): boolean;
  destroy(): void;
};

export function createCaseMorph(layer: HTMLElement): CaseMorph {
  const pos: Record<Edge, SpringState> = {
    top: { value: 0, velocity: 0 },
    right: { value: 0, velocity: 0 },
    bottom: { value: 0, velocity: 0 },
    left: { value: 0, velocity: 0 },
  };
  const fade: SpringState = { value: 1, velocity: 0 };
  let phase: 'open' | 'close' | null = null;
  let kind: 'pill' | 'card' | 'fade' = 'fade';
  // Where the shape is going, and how far it had to go when it set off (the
  // largest of its edges' distances), for how far along this phase is.
  let to: Box = { top: 0, right: 0, bottom: 0, left: 0 };
  let span = 1;
  // The small end of the way (the chip or the card: the seed opening, the
  // landing closing), and its distance from the whole screen: how grown the
  // shape is, 0 there, 1 the screen, the same measure both ways, so a close
  // that turns an opening back carries on from the very same look.
  let anchor: Box = { top: 0, right: 0, bottom: 0, left: 0 };
  let reach = 1;
  // Closing, which way each edge travels: it stops dead once it gets there.
  const dirs: Record<Edge, number> = { top: 0, right: 0, bottom: 0, left: 0 };
  let seedRadius = RADIUS;
  let W = layer.offsetWidth;
  let H = layer.offsetHeight;
  let raf = 0;
  let last = -1;
  let revealed = false;
  // What the last frame drew: whether the shape covered the whole screen.
  let covered = false;
  let done: (() => void) | null = null;
  let settledCb: (() => void) | null = null;
  let dock: (() => boolean) | null = null;
  let drop: HTMLDivElement | null = null;
  let words: HTMLSpanElement | null = null;
  // What the case shows (its scroll and its bar), faded out first, closing.
  let faces: HTMLElement[] = [];

  const view = (): Box => ({ top: 0, right: W, bottom: H, left: 0 });
  const apart = (a: Box, b: Box) => Math.max(...EDGES.map((k) => Math.abs(a[k] - b[k])));
  const now = (): Box => ({ top: pos.top.value, right: pos.right.value, bottom: pos.bottom.value, left: pos.left.value });
  // 0 where this phase set off, 1 where it is going.
  const along = () => clamp01(1 - apart(now(), to) / span);
  // 0 at the chip or the card, 1 the whole screen.
  const grown = () => clamp01(1 - apart(now(), view()) / reach);

  const onResize = () => {
    W = layer.offsetWidth;
    H = layer.offsetHeight;
    if (phase === 'open') to = view();
  };
  window.addEventListener('resize', onResize);

  const removeDrop = () => {
    drop?.remove();
    drop = words = null;
  };

  // The chip's double, laid over it: the same glass, edge and words. It
  // carries the glass while the shape is small and the paper under it is
  // still coming in (or, closing, going), and is gone once the paper has
  // the shape.
  const makeDrop = (seed: MorphSeed) => {
    drop = document.createElement('div');
    drop.className = 'cp-morph';
    drop.setAttribute('aria-hidden', 'true');
    if (seed.tint) drop.style.backgroundColor = seed.tint;
    words = document.createElement('span');
    words.className = 'cp-morph__label';
    words.textContent = seed.label ?? '';
    drop.append(words);
    // Beside the layer, over it: its glass reads what is under it, the
    // card and the paper alike.
    layer.after(drop);
  };

  // Landed as the chip with no chip to take its place: it goes as the chip
  // goes, on its own, after the layer is gone.
  const leaveDrop = () => {
    const d = drop;
    if (!d) return;
    drop = words = null;
    d.classList.add('cp-morph--leaving');
    void d.offsetWidth;
    d.style.opacity = '0';
    d.style.transform += ' scale(0.4)';
    window.setTimeout(() => d.remove(), LEAVE_MS);
  };

  const reveal = () => {
    if (revealed) return;
    revealed = true;
    layer.setAttribute('data-reveal', '');
    // The first screen's blocks come in one after another (useReveal).
    layer.dispatchEvent(new Event('cp:reveal'));
  };

  const render = () => {
    const opening = phase === 'open';
    if (kind === 'fade') {
      layer.style.opacity = clamp01(fade.value).toFixed(3);
      if (opening && fade.value > REVEAL_AT.fade) reveal();
      return;
    }
    const b: Box = {
      top: pos.top.value,
      right: Math.max(pos.right.value, pos.left.value + 1),
      bottom: Math.max(pos.bottom.value, pos.top.value + 1),
      left: pos.left.value,
    };
    const w = b.right - b.left;
    const h = b.bottom - b.top;
    const c = grown();
    // The corners: the seed's own at the small end (the chip's round ends,
    // the card's), widening to the cards' 24px as the shape grows, and
    // square where it meets the screen's edges, as it fills it.
    const gap = Math.max(b.top, b.left, W - b.right, H - b.bottom, 0);
    const base = lerp(seedRadius, RADIUS, smoothstep(0, 0.3, c));
    const nearSeed = 1 - smoothstep(0, 0.5, c);
    const r = Math.max(0, Math.min(base, w / 2, h / 2, Math.max(gap * SQUARE, base * nearSeed)));
    const inset = (v: number) => Math.max(0, v).toFixed(2);
    layer.style.clipPath =
      `inset(${inset(b.top)}px ${inset(W - b.right)}px ${inset(H - b.bottom)}px ${inset(b.left)}px ` +
      `round ${r.toFixed(2)}px)`;

    // The paper. With the chip, it comes in under the drop's glass early on
    // the way out and goes late on the way back; with the card (no glass to
    // carry it), over the card's own face, the card fading into it.
    const paper = kind === 'pill' ? smoothstep(0.04, 0.3, c) : smoothstep(0, 0.45, c);
    layer.style.opacity = paper.toFixed(3);
    covered = opening && gap <= 0.5;

    if (drop) {
      const glass = 1 - smoothstep(0.16, 0.45, c);
      if (opening && glass <= 0) {
        removeDrop();
      } else {
        drop.style.visibility = glass > 0 ? 'visible' : 'hidden';
        drop.style.transform = `translate(${b.left.toFixed(2)}px, ${b.top.toFixed(2)}px)`;
        drop.style.width = `${w.toFixed(2)}px`;
        drop.style.height = `${h.toFixed(2)}px`;
        drop.style.borderRadius = `${r.toFixed(2)}px`;
        drop.style.boxShadow = `${glassEdge(r)}, ${glassDrop(smoothstep(0, 0.4, c))}`;
        drop.style.opacity = glass.toFixed(3);
        if (words) words.style.opacity = (1 - smoothstep(0, 0.08, c)).toFixed(3);
      }
    }

    if (opening && c >= REVEAL_AT[kind]) reveal();
    // Closing, the words are gone before the paper starts to go, so nothing
    // under it ever shows through them.
    if (!opening) {
      const shown = (1 - smoothstep(0, 0.35, along())).toFixed(3);
      for (const el of faces) el.style.opacity = shown;
    }
  };

  // Done as soon as nothing more can be seen to happen: opening, once the
  // screen is covered (an edge still out past it coming back changes
  // nothing on screen); closing, once every edge has landed.
  const atRest = () =>
    kind === 'fade'
      ? Math.abs(fade.value - (phase === 'open' ? 1 : 0)) < 1e-3 && Math.abs(fade.velocity) < 1e-2
      : (phase === 'open' && covered) ||
        EDGES.every((k) => Math.abs(pos[k].value - to[k]) < REST_PX && Math.abs(pos[k].velocity) < REST_SPEED);

  const finish = () => {
    raf = 0;
    layer.style.willChange = '';
    if (phase === 'open') {
      // Nothing of the way in is left on the layer: it is the page.
      removeDrop();
      reveal();
      layer.style.clipPath = '';
      layer.style.opacity = '';
      phase = null;
      const cb = settledCb;
      settledCb = null;
      cb?.();
      return;
    }
    phase = null;
    // Landed as the chip: the chip takes its place in this same frame, or,
    // with no chip to (the pointer elsewhere), it goes as the chip goes.
    if (drop) {
      if (dock?.()) removeDrop();
      else leaveDrop();
    }
    dock = null;
    const cb = done;
    done = null;
    cb?.();
  };

  const tick = (t: number) => {
    // The first frame after the seed's starts the clock: a slow first paint
    // (the case's first screen, drawn whole) must not eat the start of it.
    if (last < 0) last = t;
    // Real time, but never more than a frame's worth at 30 fps per frame, so
    // a stall slows the motion down rather than skipping a stretch of it.
    const dt = Math.min(Math.max((t - last) / 1000, 0), 1 / 30);
    last = t;
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    const closing = phase === 'close';
    const springs = closing ? CLOSE : OPEN;
    for (let i = 0; i < steps; i++) {
      if (kind === 'fade') {
        Object.assign(fade, stepSpring(fade, closing ? 0 : 1, FADE, dt / steps));
        continue;
      }
      for (const k of EDGES) {
        Object.assign(pos[k], stepSpring(pos[k], to[k], springs[k], dt / steps));
        if (closing && dirs[k] && (pos[k].value - to[k]) * dirs[k] >= 0) {
          pos[k].value = to[k];
          pos[k].velocity = 0;
        }
      }
    }
    render();
    if (atRest()) {
      finish();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const run = () => {
    if (raf) return;
    last = -1;
    raf = requestAnimationFrame(tick);
  };

  return {
    open(seed, settled) {
      phase = 'open';
      settledCb = settled ?? null;
      revealed = false;
      W = layer.offsetWidth;
      H = layer.offsetHeight;
      to = view();
      layer.style.willChange = 'opacity';
      if (!seed) {
        kind = 'fade';
        fade.value = 0;
        fade.velocity = 0;
      } else {
        kind = seed.kind;
        seedRadius = seed.radius;
        for (const k of EDGES) {
          pos[k].value = seed.box[k];
          pos[k].velocity = 0;
        }
        anchor = { ...seed.box };
        reach = Math.max(1, apart(anchor, view()));
        span = reach;
        if (kind === 'pill') makeDrop(seed);
      }
      render();
      run();
    },
    close(seed, cb) {
      if (!layer.isConnected) return false;
      const turning = phase === 'open' && kind !== 'fade';
      phase = 'close';
      done = cb;
      settledCb = null;
      dock = seed?.dock ?? null;
      layer.setAttribute('data-leaving', '');
      faces = Array.from(layer.querySelectorAll<HTMLElement>(':scope > .cp__scroll, :scope > .cp-bar'));
      layer.style.willChange = 'opacity';
      W = layer.offsetWidth;
      H = layer.offsetHeight;
      if (!seed) {
        // Back to a fade from wherever the layer is.
        removeDrop();
        if (kind !== 'fade') fade.value = parseFloat(layer.style.opacity || '1');
        kind = 'fade';
        fade.velocity = 0;
      } else {
        // Turned back mid-way, the edges keep their speed; from rest, the
        // shape sets off from the whole screen.
        if (!turning) {
          const v = view();
          for (const k of EDGES) {
            pos[k].value = v[k];
            pos[k].velocity = 0;
          }
        }
        kind = seed.kind;
        seedRadius = seed.radius;
        to = { ...seed.box };
        anchor = { ...seed.box };
        reach = Math.max(1, apart(anchor, view()));
        span = Math.max(1, apart(now(), to));
        for (const k of EDGES) dirs[k] = Math.sign(to[k] - pos[k].value);
        // The glass for the last stretch: the chip's, with its words. One
        // still there from the way in (turned back early) carries on.
        if (kind === 'pill' && !drop) makeDrop(seed);
        if (kind === 'card') removeDrop();
      }
      render();
      run();
      return true;
    },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener('resize', onResize);
      // A drop on its way out (leaveDrop) is no longer this one's: it goes
      // by itself.
      removeDrop();
    },
  };
}
