// Whole timeline runs this many times faster than the authored durations.
export const SPEED = 1.8;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms / SPEED));
}

const ease = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export function tween(
  ms: number,
  step: (eased: number, linear: number) => void,
): Promise<void> {
  const duration = ms / SPEED;
  return new Promise((resolve) => {
    const start = performance.now();
    const frame = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      step(ease(t), t);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
