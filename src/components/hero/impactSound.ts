import { playChime } from './chime';

/**
 * The head's knock on a wall. Placeholder: the natural knock / "khm" / crunch
 * set is being built separately and replaces this file wholesale — until then
 * it forwards to the glass chime so every call site already speaks the final
 * signature. `blood` marks the hits that drew blood (the crunchy ones).
 */
export function playImpact(impact: number, pan: number, opts?: { blood?: boolean }): void {
  playChime(impact, pan, opts?.blood ? { pitch: 0.7, level: 1.3 } : undefined);
}
