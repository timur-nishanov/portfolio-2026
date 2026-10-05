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

/** Takes per kind; files are /sounds/<name>.mp3 (MP3 decodes everywhere, Safari included). */
const TAKES: Record<SoundKind, string[]> = {
  thump: ['thump-1', 'thump-2', 'thump-3', 'thump-4', 'thump-5'],
  heavy: ['thump-heavy-1', 'thump-heavy-2', 'thump-heavy-3'],
  khm: ['khm-1', 'khm-2', 'khm-3', 'khm-4'],
  crunch: ['crunch-1', 'crunch-2', 'crunch-3'],
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
const CRUNCH_FROM = 1.5;
const CRUNCH_CHANCE = 0.16;
const CRUNCH_COOLDOWN_MS = 3000;

export interface Voice {
  kind: SoundKind;
  take: number; // index into TAKES[kind]
  /** Peak level of this voice in dBFS — the files are normalised to -1. */
  peakDb: number;
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

/** A random take of `kind`, never the one that played last. */
function pickTake(s: PlanState, kind: SoundKind, rand: () => number) {
  const n = TAKES[kind].length;
  const prev = s.lastTake[kind];
  let i = Math.floor(rand() * (prev === undefined ? n : n - 1));
  if (prev !== undefined && i >= prev) i += 1;
  s.lastTake[kind] = i;
  return i;
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

  if (now - s.lastAt < MIN_GAP_MS) {
    // The second wall of a corner: stay quiet — unless it's the one that bled,
    // whose crunch must not be swallowed by the gap.
    if (blood && now - s.lastCrunchAt > 300) {
      s.lastCrunchAt = now;
      voices.push({ kind: 'crunch', take: pickTake(s, 'crunch', rand), peakDb: -15, rate: 0.96 + rand() * 0.08, delay: 0.012, pan });
    }
    return voices;
  }
  s.lastAt = now;

  // The thump is the hit itself: every knock gets one. Louder and a touch
  // higher with force, as a real knock is — -28 dBFS at a graze, -14 at most.
  const heavy = impact > HEAVY_FROM && rand() < 0.75;
  const kind: SoundKind = heavy ? 'heavy' : 'thump';
  voices.push({
    kind,
    take: pickTake(s, kind, rand),
    peakDb: -28 + 14 * Math.sqrt(t),
    rate: 0.93 + 0.1 * t + (rand() - 0.5) * 0.06,
    delay: 0,
    pan,
  });

  // The crunch rides just behind the thump, in the tail of the knock.
  const crunch =
    blood ||
    (impact > CRUNCH_FROM && now - s.lastCrunchAt > CRUNCH_COOLDOWN_MS && rand() < CRUNCH_CHANCE);
  if (crunch) {
    s.lastCrunchAt = now;
    voices.push({
      kind: 'crunch',
      take: pickTake(s, 'crunch', rand),
      peakDb: -18 + 3 * t,
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
      peakDb: -21 + 4 * t,
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
  /** MP3 encoders pad the start with silence; start past it so the knock lands on the frame. */
  offset: number;
}

let ctx: AudioContext | null = null;
let loading: Promise<void> | null = null;
const takes = new Map<string, Take>();
const state = createPlanState();

function getContext() {
  if (!ctx) {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    ctx = new AudioContext();
  }
  return ctx;
}

function leadingSilence(b: AudioBuffer) {
  const d = b.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  const thr = peak * 0.02;
  let i = 0;
  while (i < d.length && Math.abs(d[i]) < thr) i++;
  return Math.max(0, i / b.sampleRate - 0.001);
}

/** Fetch and decode every take once (~40 KB in all), in the background. */
function load() {
  const c = getContext();
  if (!c || loading) return;
  const names = Object.values(TAKES).flat();
  loading = Promise.all(
    names.map(async (name) => {
      try {
        const res = await fetch(`/sounds/${name}.mp3`);
        const buffer = await c.decodeAudioData(await res.arrayBuffer());
        takes.set(name, { buffer, offset: leadingSilence(buffer) });
      } catch {
        // A missing take just stays silent; the others still play.
      }
    }),
  ).then(() => undefined);
}

/**
 * Browsers keep audio locked until the user interacts. The first press both
 * unlocks the context (resume inside a gesture is allowed) and starts the
 * download — the head can't hit a wall hard before someone touches it anyway.
 */
function unlock() {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  load();
}

if (typeof window !== 'undefined') {
  const once = () => {
    unlock();
    window.removeEventListener('pointerdown', once, true);
    window.removeEventListener('keydown', once, true);
  };
  window.addEventListener('pointerdown', once, true);
  window.addEventListener('keydown', once, true);
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
  const t0 = c.currentTime + 0.005;
  for (const v of voices) {
    const take = takes.get(TAKES[v.kind][v.take]);
    if (!take) continue; // not decoded yet
    const src = new AudioBufferSourceNode(c, { buffer: take.buffer, playbackRate: v.rate });
    // Files peak at -1 dBFS; scale to the planned peak.
    const gain = new GainNode(c, { gain: Math.pow(10, (v.peakDb + 1) / 20) });
    const panner = new StereoPannerNode(c, { pan: v.pan });
    src.connect(gain).connect(panner).connect(c.destination);
    src.start(t0 + v.delay, take.offset);
  }
}
