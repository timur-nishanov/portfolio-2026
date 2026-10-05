/**
 * What the head sounds like when it hits a wall: a dull body thump, now and
 * then a light "khm" from its owner, and on the hard knocks a crunch — always
 * when the hit draws blood. Recorded, not synthesized (CC0 sources, see
 * public/sounds/CREDITS.txt): a synthetic thud reads as a drum, and a
 * synthetic voice as a robot.
 *
 * The choice of what plays is a pure function (`planImpact`) so the rhythm —
 * mostly thumps, vocals rare, never the same take twice running — can be
 * checked without a browser.
 */

export type SoundKind = 'thump' | 'heavy' | 'khm' | 'crunch';

/**
 * Takes per kind, each with its loudness trim in dB and an optional pick
 * weight (default 1); files are /sounds/<name>.mp3 (MP3 decodes everywhere,
 * Safari included). The files are normalised by peak, and peak says little
 * about loudness: the bassy heavy takes played ~5 dB softer than a thump at
 * the same peak (a full flick sounded weaker than a tap), the open-mouthed
 * khm-2 4–5 dB louder. The trims bring every take level with the thumps on
 * short-term loudness (100 ms, the mean of A-weighted and of a 250 Hz
 * high-pass, i.e. a laptop or phone speaker), so the levels planned below
 * compare as heard.
 * khm-4/5/6 are the real "kh-m": a breathy throat burst, then a closed-mouth
 * hum at 105–150 Hz. khm-2 is a shorter "hmf" grunt with no "kh", so it only
 * comes up now and then, for variety.
 */
const TAKES: Record<SoundKind, [name: string, trimDb: number, weight?: number][]> = {
  thump: [['thump-1', 0.3], ['thump-2', -0.4], ['thump-3', 0.4], ['thump-4', -0.5], ['thump-5', 0.3]],
  heavy: [['thump-heavy-1', 5.6], ['thump-heavy-2', 6.2], ['thump-heavy-3', 5.3]],
  khm: [['khm-4', 0.5, 2], ['khm-5', -1.0, 2], ['khm-6', 1.2, 2], ['khm-2', -4.7, 1]],
  crunch: [['crunch-1', -1.7], ['crunch-2', -0.5], ['crunch-3', -0.1]],
};

// Below this the head only grazed the wall — silence, like a real graze.
const GRAZE = 0.22;
// Corner rattles fire two walls in one frame; one knock per beat is plenty.
const MIN_GAP_MS = 110;
// Above this a thump uses the heavier, boomier takes. A tap-throw lands at
// ~1.6–1.8, a full flick at ~2.3–2.6.
const HEAVY_FROM = 1.9;
// The voice is a joke that dies if repeated: rare, and never twice within a
// few seconds (the cooldown is re-rolled each time so it doesn't feel timed).
const KHM_FROM = 0.6;
const KHM_CHANCE = 0.2;
const KHM_COOLDOWN_MS: [number, number] = [2000, 4000];
// The crunch is the punchline, so the hard end of a tap-throw (its wall hits
// run ~1–1.8) earns one now and then, likelier the harder it lands: from 1.5
// with a flat 16%, a visitor who only taps heard about one a minute and a
// third never heard it at all.
const CRUNCH_FROM = 1.2;
const CRUNCH_CHANCE = 0.12; // + CRUNCH_CHANCE_FORCE × force (0…1)
const CRUNCH_CHANCE_FORCE = 0.2;
const CRUNCH_COOLDOWN_MS = 3000;
// Levels against the knock (dB, takes loudness-matched): the heavy takes a
// touch above it, so a full flick lands over 3 dB louder than a tap; the
// crunch just over it — it is the punchline; the khm just under it, a light
// remark rather than a shout.
const HEAVY_LIFT = 1;
const CRUNCH_LIFT = 1.5;
const KHM_LIFT = -2.5;

export interface Voice {
  kind: SoundKind;
  take: number; // index into TAKES[kind]
  /** Level in dB: the peak (dBFS) a thump take would play at to sound as
      loud. Each take's trim is applied on playback. */
  db: number;
  /** Playback rate: pitch and length together, like tape. */
  rate: number;
  /** Seconds after the hit. */
  delay: number;
  /** -1..1 */
  pan: number;
}

export interface PlanState {
  lastAt: number;
  lastKhmAt: number;
  khmCooldown: number;
  lastCrunchAt: number;
  lastTake: Partial<Record<SoundKind, number>>;
}

export const createPlanState = (): PlanState => ({
  lastAt: -Infinity,
  lastKhmAt: -Infinity,
  khmCooldown: KHM_COOLDOWN_MS[0],
  lastCrunchAt: -Infinity,
  lastTake: {},
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** A random take of `kind` by weight, never the one that played last. */
function pickTake(s: PlanState, kind: SoundKind, rand: () => number) {
  const list = TAKES[kind];
  const prev = s.lastTake[kind];
  let total = 0;
  for (let i = 0; i < list.length; i++) if (i !== prev) total += list[i][2] ?? 1;
  let r = rand() * total;
  let pick = 0;
  for (let i = 0; i < list.length; i++) {
    if (i === prev) continue;
    pick = i;
    r -= list[i][2] ?? 1;
    if (r < 0) break;
  }
  s.lastTake[kind] = pick;
  return pick;
}

/**
 * Decide what one wall hit sounds like. Mutates `s` (cooldowns, last takes).
 * `now` is in ms; `rand` is injectable for the selection test.
 */
export function planImpact(
  s: PlanState,
  impact: number,
  pan: number,
  blood: boolean,
  now: number,
  rand: () => number = Math.random,
): Voice[] {
  if (impact < GRAZE) return [];
  pan = clamp(pan, -1, 1);
  const voices: Voice[] = [];
  // 0 at a graze, 1 at a full flick (anything harder just stays at the top).
  const t = clamp((impact - GRAZE) / 2.4, 0, 1);
  // The knock is louder and a touch higher with force, as a real one is:
  // -28 dB at a graze, -14 at most. Everything else is set against it.
  const knock = -28 + 14 * Math.sqrt(t);

  if (now - s.lastAt < MIN_GAP_MS) {
    // The second wall of a corner: stay quiet — unless it's the one that bled,
    // whose crunch must not be swallowed by the gap.
    if (blood && now - s.lastCrunchAt > 300) {
      s.lastCrunchAt = now;
      voices.push({ kind: 'crunch', take: pickTake(s, 'crunch', rand), db: knock + CRUNCH_LIFT, rate: 0.96 + rand() * 0.08, delay: 0.012, pan });
    }
    return voices;
  }
  s.lastAt = now;

  // The thump is the hit itself: every knock gets one.
  const heavy = impact > HEAVY_FROM && rand() < 0.75;
  const kind: SoundKind = heavy ? 'heavy' : 'thump';
  voices.push({
    kind,
    take: pickTake(s, kind, rand),
    db: knock + (heavy ? HEAVY_LIFT : 0),
    rate: 0.93 + 0.1 * t + (rand() - 0.5) * 0.06,
    delay: 0,
    pan,
  });

  // The crunch rides just behind the thump, in the tail of the knock.
  const crunch =
    blood ||
    (impact > CRUNCH_FROM &&
      now - s.lastCrunchAt > CRUNCH_COOLDOWN_MS &&
      rand() < CRUNCH_CHANCE + CRUNCH_CHANCE_FORCE * t);
  if (crunch) {
    s.lastCrunchAt = now;
    voices.push({
      kind: 'crunch',
      take: pickTake(s, 'crunch', rand),
      db: knock + CRUNCH_LIFT,
      rate: 0.95 + rand() * 0.1,
      delay: 0.012 + rand() * 0.015,
      pan,
    });
  }

  // "Khm" — a beat after the hit, the way a reaction comes. Not on a crunch
  // (one remark per knock), and a voice comes from the head, so it sits a
  // little more central than the knock on the wall.
  if (
    !crunch &&
    impact > KHM_FROM &&
    now - s.lastKhmAt > s.khmCooldown &&
    rand() < KHM_CHANCE + 0.1 * t
  ) {
    s.lastKhmAt = now;
    s.khmCooldown = KHM_COOLDOWN_MS[0] + rand() * (KHM_COOLDOWN_MS[1] - KHM_COOLDOWN_MS[0]);
    voices.push({
      kind: 'khm',
      take: pickTake(s, 'khm', rand),
      db: knock + KHM_LIFT,
      rate: 0.96 + rand() * 0.08,
      delay: 0.07 + rand() * 0.06,
      pan: pan * 0.6,
    });
  }
  return voices;
}

// ---- Web Audio ------------------------------------------------------------

interface Take {
  buffer: AudioBuffer;
  /** Where to start playing (s): past the encoder's silent padding, and for
      the knocks past their quiet pre-roll, so the hit lands on the frame. */
  offset: number;
}

let ctx: AudioContext | null = null;
let loading: Promise<void> | null = null;
const takes = new Map<string, Take>();
const state = createPlanState();

function getContext() {
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

/**
 * Where a take really starts. MP3 encoders pad the start with silence, and
 * three of the knocks also carry ~17 ms of near-silent pre-roll before the
 * hit — started there, the crunch scheduled 12 ms after a knock came in ahead
 * of it. So a knock starts 2 ms before its attack (10% of peak; the gain
 * fades in over those 2 ms), while a voice keeps its soft onset (2%), which
 * is where the "kh" lives.
 */
function startOffset(b: AudioBuffer, voice: boolean) {
  const d = b.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  const thr = peak * (voice ? 0.02 : 0.1);
  let i = 0;
  while (i < d.length && Math.abs(d[i]) < thr) i++;
  return Math.max(0, i / b.sampleRate - (voice ? 0.001 : 0.002));
}

const ALL = (Object.keys(TAKES) as SoundKind[]).flatMap((kind) => TAKES[kind].map(([name]) => ({ kind, name })));

/**
 * The files' bytes, fetched once. They are prefetched shortly after the page
 * has loaded, which needs no AudioContext: fetched on the first gesture, a
 * head grabbed by a wall and slammed into it knocked before the download was
 * in on a slow phone line, and that first knock — the one that sets the
 * impression — was silent.
 */
const bytes = new Map<string, Promise<ArrayBuffer | null>>();

function fetchTake(name: string) {
  let p = bytes.get(name);
  if (!p) {
    p = fetch(`/sounds/${name}.mp3`)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    bytes.set(name, p);
  }
  return p;
}

function prefetch() {
  for (const { name } of ALL) void fetchTake(name);
}

/** Decode every take once (~40 KB in all), in the background, as soon as a
    context exists (decoding works on a suspended one too). */
function load() {
  const c = getContext();
  if (!c || loading) return;
  loading = Promise.all(
    ALL.map(async ({ kind, name }) => {
      const data = await fetchTake(name);
      if (!data) return; // a missing take just stays silent; the others still play
      try {
        const buffer = await c.decodeAudioData(data);
        takes.set(name, { buffer, offset: startOffset(buffer, kind === 'khm') });
      } catch {
        /* undecodable: silent too */
      }
    }),
  ).then(() => undefined);
}

/**
 * Browsers keep audio locked until the user interacts, and they disagree on
 * what counts: a touch's pointerdown is not a user activation (pointerup,
 * touchend and click are), and WebKit has long unlocked only on touchend. So
 * every kind of gesture tries, and the listeners only stand down once the
 * context really runs — a one-shot on the first press could leave an iPhone
 * silent for the whole visit, since a resume from the animation loop is
 * refused. The first gesture also creates the context, and with it the
 * decoding of the prefetched takes.
 */
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'] as const;
let armed = false;

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
  const c = getContext();
  if (!c) return disarm();
  load();
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
  // Fetch the takes once the page has settled (idle, or 1.5 s where there is
  // no idle callback — Safari), well before anyone can throw the head.
  const soon = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 3000 });
    else setTimeout(prefetch, 1500);
  };
  if (document.readyState === 'complete') soon();
  else window.addEventListener('load', soon, { once: true });
  // Back from the background: try to pick up where it was (the gestures are
  // armed again anyway if this is refused).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running' && ctx.state !== 'closed') {
      ctx.resume().catch(() => {});
    }
  });
}

/**
 * A wall hit. `impact` is the speed into the wall in world units/s (≈0.2 a
 * graze … 2.6 a full flick), `pan` -1..1 toward the wall that was hit.
 */
export function playImpact(impact: number, pan: number, opts?: { blood?: boolean }): void {
  const c = getContext();
  if (!c) return;
  // Still locked: ask to wake and skip this hit rather than queue it into a
  // stopped clock, where it would burst out stale on the first click.
  if (c.state !== 'running') {
    void c.resume();
    load();
    return;
  }
  load();
  const voices = planImpact(state, impact, pan, !!opts?.blood, performance.now());
  // Lead the clock by at least its output latency. currentTime advances in
  // hardware-buffer steps (often 10 ms or more), so a 5 ms lead could already
  // be in the past when start() ran: the start slipped and the fade-in that
  // keeps a mid-signal start from clicking fell before it, i.e. was skipped.
  const t0 = c.currentTime + Math.max(0.01, c.baseLatency || 0);
  for (const v of voices) {
    const [name, trimDb] = TAKES[v.kind][v.take];
    const take = takes.get(name);
    if (!take) continue; // not decoded yet
    const at = Math.max(c.currentTime + 0.003, t0 + v.delay);
    const src = new AudioBufferSourceNode(c, { buffer: take.buffer, playbackRate: v.rate });
    // Files peak at -1 dBFS: the trim makes the take as loud as a thump, then
    // it plays at the planned level. A 2 ms fade-in, since a knock starts
    // mid-signal (see startOffset) and a hard edge would click.
    const gain = new GainNode(c, { gain: 0 });
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(Math.pow(10, (v.db + 1 + trimDb) / 20), at + 0.002);
    const panner = new StereoPannerNode(c, { pan: v.pan });
    src.connect(gain).connect(panner).connect(c.destination);
    src.start(at, take.offset);
  }
}
