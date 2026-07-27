/**
 * Tiny semi-implicit spring integrator for hand-rolled rAF animations
 * (magnetic buttons, head follow). motion's springs cover the pill/FLIP; this
 * is for the per-frame value chasing where a library call per frame is wasteful.
 */
export type SpringConfig = { stiffness: number; damping: number; mass?: number };

export type SpringState = { value: number; velocity: number };

export function stepSpring(
  state: SpringState,
  target: number,
  { stiffness, damping, mass = 1 }: SpringConfig,
  dt: number,
): SpringState {
  // Clamp dt so a backgrounded tab that resumes doesn't explode the integrator.
  const h = Math.min(dt, 1 / 30);
  const force = -stiffness * (state.value - target);
  const damper = -damping * state.velocity;
  const accel = (force + damper) / mass;
  const velocity = state.velocity + accel * h;
  const value = state.value + velocity * h;
  return { value, velocity };
}

export const settled = (state: SpringState, target: number, eps = 0.01): boolean =>
  Math.abs(state.value - target) < eps && Math.abs(state.velocity) < eps;
