'use client';

import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type ScrambleHandle = { play: () => void };

// Substitution glyphs: digits + a few 5by7 symbols. No latin — it reads as a
// typo rather than an effect (TZ §5.4).
const GLYPHS = '0123456789#%*+=/<>'.split('');

// Paced so the reveal is readable rather than a blink — it was over almost
// before the eye caught it.
const LOCK_STEP = 62; // ms — char i locks at i * LOCK_STEP
const SWAP_EVERY = 80; // ms — random glyph swap cadence before a char locks
const TAIL = 320; // ms — trailing settle time

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
 *
 * Memoised on purpose: a parent re-render mid-animation would re-render the
 * `{text}` child and overwrite the textContent the rAF is driving, which reads
 * as a hard flicker. Memo keeps React out of the way while the effect runs.
 */
const ScrambleTextInner = forwardRef<ScrambleHandle, Props>(function ScrambleText(
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
      // rAF reports the frame's start time, which can predate the
      // performance.now() taken in the event handler — without the clamp the
      // first frame runs with a negative elapsed and indexes GLYPHS below zero,
      // painting "undefined" into the label.
      const elapsed = Math.max(0, now - startRef.current);
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
          // Swap on a coarse cadence so it doesn't strobe every frame.
          const seed = Math.floor(elapsed / SWAP_EVERY) + i * 7;
          out += GLYPHS[((seed % GLYPHS.length) + GLYPHS.length) % GLYPHS.length];
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

  // Replay when the label itself changes (COPY MAIL → COPIED).
  const prevText = useRef(text);
  useEffect(() => {
    if (prevText.current !== text) {
      prevText.current = text;
      play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Cancel in flight and restore the true text if we unmount mid-scramble.
  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <span className={className} aria-label={text}>
      <span ref={layerRef} aria-hidden="true">
        {text}
      </span>
    </span>
  );
});

export const ScrambleText = memo(ScrambleTextInner);
