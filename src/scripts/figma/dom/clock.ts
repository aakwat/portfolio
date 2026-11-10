import { ease, scaled } from "../core/timing";

// Timeline pause, scaled by SPEED with everything else.
export function sleep(ms: number): Promise<void> {
  return wait(scaled(ms));
}

// Real-time pause, for things that must keep a human pace (typing).
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Runs `step` every frame for `ms` (scaled), with eased and linear progress.
export function tween(ms: number, step: (eased: number, linear: number) => void): Promise<void> {
  const duration = scaled(ms);
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
