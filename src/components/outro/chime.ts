/**
 * The knock of a ball of glass (Outro) — synthesized, not sampled. A glass
 * tap is a handful of inharmonic partials dying fast; three detuned sine
 * modes get there in under a kilobyte, with no asset on the wire and no two
 * taps exactly alike (a looped sample turns into a metronome by the third
 * hit). Level rides the impact, pitch rises a little with it, and the pan
 * follows where it struck, so a knock on the right rings from the right.
 */

import { audioContext } from '@/lib/audio';

// Mode ratios of a struck glass — deliberately inharmonic. Whole-number
// ratios ring like an organ pipe; these ring like a tumbler.
const MODES = [1, 2.32, 4.25];
// Corner rattles and a heap of balls all knocking at once would otherwise
// machine-gun the chime into a buzz — one ring per beat is plenty.
const MIN_GAP_MS = 110;

let lastAt = 0;

export function playChime(
  impact: number,
  pan: number,
  opts?: {
    /** Frequency multiplier — under 1 rings deeper, a bowl instead of a glass. */
    pitch?: number;
    /** Loudness multiplier on top of the impact curve. */
    level?: number;
  },
) {
  const pitch = opts?.pitch ?? 1;
  const loudness = opts?.level ?? 1;
  // Grazing contacts stay silent — only a real knock rings.
  if (impact < 0.18) return;
  const now = performance.now();
  if (now - lastAt < MIN_GAP_MS) return;
  // The page's one context (lib/audio), unlocked by the first gesture
  // anywhere: a click on a card, the head thrown, a key. Until then (a
  // visitor who has only scrolled) skip the hit rather than schedule it into
  // a stopped clock, where it would burst out, stale, on the first click.
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state !== 'running') {
    void ctx.resume();
    return;
  }
  lastAt = now;

  const t = ctx.currentTime;
  // Light means light: even the hardest hit stays around -26 dBFS.
  const level = Math.min(0.05, 0.012 + impact * 0.016) * loudness;
  const base = (1500 + Math.random() * 500 + Math.min(impact, 2) * 260) * pitch;

  const out = ctx.createGain();
  const panner = new StereoPannerNode(ctx, { pan });
  out.connect(panner);
  panner.connect(ctx.destination);

  MODES.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.02);
    const g = ctx.createGain();
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
