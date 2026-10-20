/**
 * The page's one AudioContext, for every sound on it (the head's knocks and
 * voice, the outro's glass), and its unlocking.
 *
 * Browsers keep audio locked until the user interacts, and they disagree on
 * what counts: a touch's pointerdown is not a user activation (pointerup,
 * touchend and click are), and WebKit has long unlocked only on touchend. So
 * every kind of gesture tries, anywhere on the page, from the moment it
 * loads, and the listeners only stand down once the context really runs — a
 * one-shot on the first press could leave an iPhone silent for the whole
 * visit, since a resume from an animation loop is refused.
 *
 * One context for all of them: the outro's own, made on its balls' first
 * knock from the animation loop, stayed locked whatever had been clicked
 * before, so the balls' first fall was always silent. A visitor who has only
 * scrolled has not unlocked anything (scrolling is not a gesture, to a
 * browser), and there nothing can sound until the first press.
 */

const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;

let ctx: AudioContext | null = null;
let armed = false;
const onGesture = new Set<() => void>();

/** The context, made on first use; locked until a gesture has unlocked it. */
export function audioContext(): AudioContext | null {
  if (!ctx) {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    const c = new AudioContext();
    // iOS stops a running context for a call or a trip to the background
    // ('interrupted'); it then needs a gesture again.
    c.addEventListener('statechange', () => {
      if (c.state !== 'running' && c.state !== 'closed') arm();
    });
    ctx = c;
  }
  return ctx;
}

/** Something to do on each unlocking gesture, once the context exists (the
    head starts decoding its takes then). */
export function onAudioGesture(fn: () => void) {
  onGesture.add(fn);
}

function arm() {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  for (const type of GESTURES) window.addEventListener(type, unlock, true);
}

function disarm() {
  armed = false;
  for (const type of GESTURES) window.removeEventListener(type, unlock, true);
}

function unlock() {
  const c = audioContext();
  if (!c) return disarm();
  onGesture.forEach((fn) => fn());
  if (c.state === 'running') return disarm();
  try {
    // Older iOS also wants a sound started inside the gesture: one silent sample.
    const src = c.createBufferSource();
    src.buffer = c.createBuffer(1, 1, c.sampleRate);
    src.connect(c.destination);
    src.start();
  } catch {
    /* resume() below is what matters */
  }
  c.resume().then(
    () => {
      if (c.state === 'running') disarm();
    },
    () => {},
  );
}

if (typeof window !== 'undefined') {
  arm();
  // Back from the background: try to pick up where it was (the gestures are
  // armed again anyway if this is refused).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running' && ctx.state !== 'closed') {
      ctx.resume().catch(() => {});
    }
  });
}
