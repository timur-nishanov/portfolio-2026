/**
 * The knock of the head on a wall — synthesized, not sampled. A glass tap is
 * a handful of inharmonic partials dying fast; three detuned sine modes get
 * there in under a kilobyte, with no asset on the wire and no two taps
 * exactly alike (a looped sample turns into a metronome by the third hit).
 * Level rides the impact, pitch rises a little with it, and the pan follows
 * the wall, so a right-wall knock rings from the right.
 */

// Mode ratios of a struck glass — deliberately inharmonic. Whole-number
// ratios ring like an organ pipe; these ring like a tumbler.
const MODES = [1, 2.32, 4.25];
// Corner rattles fire hitWall several times a frame; unthrottled they
// machine-gun the chime into a buzz.
const MIN_GAP_MS = 70;

let ctx: AudioContext | null = null;
let lastAt = 0;

export function playChime(impact: number, pan: number) {
  // Grazing contacts stay silent — only a real knock rings.
  if (impact < 0.18) return;
  const now = performance.now();
  if (now - lastAt < MIN_GAP_MS) return;
  if (!ctx) {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return;
    ctx = new AudioContext();
  }
  // Browsers keep a fresh context suspended until the user has interacted
  // with the page. Ask it to wake and skip this hit rather than schedule
  // into a stopped clock — a chime queued now would burst out, stale, on
  // the first click. The first grab unlocks it; every hit after that rings.
  if (ctx.state === 'suspended') {
    void ctx.resume();
    return;
  }
  lastAt = now;

  const t = ctx.currentTime;
  // Light means light: even the hardest hit stays around -26 dBFS.
  const level = Math.min(0.05, 0.012 + impact * 0.016);
  const base = 1500 + Math.random() * 500 + Math.min(impact, 2) * 260;

  const out = ctx.createGain();
  const panner = new StereoPannerNode(ctx, { pan });
  out.connect(panner);
  panner.connect(ctx.destination);

  MODES.forEach((ratio, i) => {
    const osc = ctx!.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.02);
    const g = ctx!.createGain();
    const peak = level / (1 + i * 1.6); // upper modes quieter,
    const decay = 0.14 / (1 + i * 0.8); // and gone sooner — that's the glass
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + decay + 0.02);
  });
}
