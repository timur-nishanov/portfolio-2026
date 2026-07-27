'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type ScrambleHandle = { play: () => void };

// Substitution glyphs: digits + a few 5by7 symbols. No latin — it reads as a
// typo rather than an effect (TZ §5.4).
const GLYPHS = '0123456789#%*+=/<>'.split('');
const randGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

const LOCK_STEP = 28; // ms — char i locks at i * LOCK_STEP
const SWAP_EVERY = 45; // ms — random glyph swap cadence before a char locks
const TAIL = 220; // ms — trailing settle time

type Props = {
  text: string;
  className?: string;
  /** When this flips true (e.g. becomes active) the scramble replays. */
  active?: boolean;
};

/**
 * Progressive left-to-right character scramble (TZ §5.4). Single rAF, writes
 * via textContent on an aria-hidden layer; the real text lives in aria-label so
 * screen readers never see the churn. 5by7 is monospace, so width is stable and
 * the pill doesn't twitch — do not change letter-spacing mid-effect.
 */
export const ScrambleText = forwardRef<ScrambleHandle, Props>(function ScrambleText(
  { text, className = '', active = false },
  ref,
) {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const play = () => {
    if (reduced) return;
    const el = layerRef.current;
    if (!el) return;
    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();
    const total = text.length * LOCK_STEP + TAIL;

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ') {
          out += ' ';
          continue;
        }
        const lockAt = i * LOCK_STEP;
        if (elapsed >= lockAt) {
          out += ch; // locked to final glyph
        } else {
          // swap on a coarse cadence so it doesn't strobe every frame
          const seed = Math.floor(elapsed / SWAP_EVERY) + i;
          out += GLYPHS[seed % GLYPHS.length] === ch ? randGlyph() : GLYPHS[seed % GLYPHS.length];
        }
      }
      el.textContent = out;
      if (elapsed < total) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        el.textContent = text; // never leave on garbage
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({ play }));

  // Replay when the item becomes active.
  const wasActive = useRef(active);
  useEffect(() => {
    if (active && !wasActive.current) play();
    wasActive.current = active;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <span className={className} aria-label={text}>
      <span ref={layerRef} aria-hidden="true">
        {text}
      </span>
    </span>
  );
});
