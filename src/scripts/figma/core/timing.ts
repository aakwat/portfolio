// Whole timeline runs this many times faster than the authored durations.
export const SPEED = 2.4;

export function scaled(ms: number): number {
  return ms / SPEED;
}

// Ease in and out (cubic), so moves start and stop softly like a hand.
export function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}
