'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// Word timings (ms). In: each word clears out of a blur, a touch after the one
// before it. Out: the same, faster, so the next note isn't kept waiting.
const IN_MS = 720;
const IN_STAGGER = 26;
const OUT_MS = 360;
const OUT_STAGGER = 10;
const FADE_MS = 260; // reduced motion: a plain cross-fade
// Pointing at the note holds it; once the pointer leaves, it stays at least
// this long before it goes.
const RESUME_MIN = 1200;

// What animates as one piece: split on ordinary spaces only, so words tied
// with a no-break space ("6 steps to 1.") stay one unbreakable unit.
const unitsOf = (text: string) => text.trim().split(/ +/);
// Reading time still counts every word, tied or not.
const wordCount = (text: string) => text.trim().split(/\s+/).length;

/** How long a note stays up once it is in: a brisk ~300 wpm skim plus a short
 *  beat, never shorter than 3.5 s or longer than 7 s (about 5.7 s for these
 *  four-line notes). Pointing at a note still holds it for slower readers. */
export const holdFor = (text: string) => Math.min(7000, Math.max(3500, 900 + wordCount(text) * 200));

type Props = {
  notes: string[];
  className?: string;
  /** Which note to open on, already shown (the case page's copy of a card
   *  carries on from the card's note). */
  startAt?: number;
};

/**
 * Notes that take turns in one place. The block is anchored by its top edge
 * and never re-centres: a longer note only grows downward, and in the stacked
 * mobile layout an invisible copy of every note holds the tallest height, so
 * nothing below shifts. Runs only while on screen and the tab is visible, and
 * holds while a mouse points at it — someone reading shouldn't lose the line.
 */
export function RotatingNotes({ notes, className = '', startAt = 0 }: Props) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() => (startAt >= 0 && startAt < notes.length ? startAt : 0));
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [active, setActive] = useState(false);
  const [held, setHeld] = useState(false);
  // What was left of a note's time when it was held or scrolled away.
  const left = useRef<number | null>(null);
  // The first note is simply there on load; every note after it animates in.
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  // A note on its way out always finishes leaving; only a shown one is held.
  const running = active && (phase === 'out' || !held);

  useEffect(() => {
    if (!running || notes.length < 2) return;
    const n = unitsOf(notes[index]).length;
    if (phase === 'in') {
      const entering = !animated ? 0 : reduced ? FADE_MS : IN_MS + (n - 1) * IN_STAGGER;
      const wait = left.current ?? entering + holdFor(notes[index]);
      const start = performance.now();
      let fired = false;
      const t = window.setTimeout(() => {
        fired = true;
        left.current = null;
        setPhase('out');
      }, wait);
      return () => {
        window.clearTimeout(t);
        if (!fired) left.current = Math.max(RESUME_MIN, wait - (performance.now() - start));
      };
    }
    const leaving = reduced ? FADE_MS : OUT_MS + (n - 1) * OUT_STAGGER;
    const t = window.setTimeout(() => {
      setAnimated(true);
      // A fresh note gets its full time (a click may have cut the last short).
      left.current = null;
      setIndex((i) => (i + 1) % notes.length);
      setPhase('in');
    }, leaving);
    return () => window.clearTimeout(t);
  }, [running, phase, index, notes, reduced, animated]);

  const hold = (e: React.PointerEvent, on: boolean) => {
    if (e.pointerType === 'mouse') setHeld(on);
  };

  // A click on the note skips to the next one, for anyone reading faster. It
  // stays on the notes: the card's own click is kept for opening the case.
  const skip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notes.length > 1 && phase === 'in') setPhase('out');
  };

  const words = useMemo(() => unitsOf(notes[index]), [notes, index]);

  return (
    <div
      ref={rootRef}
      className={`rn ${className}`}
      data-note={index}
      onPointerEnter={(e) => hold(e, true)}
      onPointerLeave={(e) => hold(e, false)}
      onClick={skip}
    >
      {/* Screen readers get every note once, not a live region that keeps
          interrupting. */}
      <ul className="sr-only">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <div className="rn__stack" aria-hidden="true">
        {/* Where this note sits among the others: a hairline track with one
            dark segment per note, sliding down as they take turns — so it
            reads at a glance that more is coming. */}
        {notes.length > 1 && (
          <span className="rn__track">
            <span
              className="rn__thumb"
              style={{
                height: `${100 / notes.length}%`,
                transform: `translateY(${index * 100}%)`,
              }}
            />
          </span>
        )}
        {notes.map((note) => (
          <p key={note} className="rn__sizer">
            {note}
          </p>
        ))}
        <p
          key={index}
          className="rn__live"
          data-phase={phase}
          data-animate={animated || phase === 'out' ? '' : undefined}
          data-reduced={reduced ? '' : undefined}
        >
          {words.map((w, i) => (
            <span key={i}>
              <span className="rn__w" style={{ '--i': i } as React.CSSProperties}>
                {w}
              </span>
              {i < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
