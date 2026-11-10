import { NOTES } from "../core/people";
import { between, chance, pick } from "../core/random";
import { sleep } from "../dom/clock";
import { isRendered, labelOf } from "../dom/overlay";
import type { Cursor } from "../ui/cursor";
import { select } from "../ui/selection";

// Drifts to a built layer, sometimes selects it or leaves a note, until stopped.
async function wander(c: Cursor, targets: () => HTMLElement[], stopped: () => boolean): Promise<void> {
  while (!stopped()) {
    const built = targets();
    if (built.length === 0) {
      await sleep(200);
      continue;
    }
    const target = pick(built);
    await c.toEl(target, between(0.15, 0.85), between(0.2, 0.8));
    if (stopped()) break;
    let off: (() => void) | null = null;
    if (chance(0.55)) {
      await c.click();
      off = select(target, c.person.tone, false, labelOf(target));
    }
    if (chance(0.25)) await c.chat(pick(NOTES), 900);
    else await c.idle(between(300, 800));
    off?.();
  }
}

// Sets cursors wandering over what is already built inside `area`; the returned stop waits for them.
export function roam(cursors: readonly Cursor[], area: Element, start = 300, stagger = 300): () => Promise<void> {
  let stopped = false;
  // Hidden layers (display: none on phones) have no position to wander to.
  const built = (): HTMLElement[] => [...area.querySelectorAll<HTMLElement>(".fb-shown")].filter(isRendered);
  const runs = cursors.map((c, i) => sleep(start + i * stagger).then(() => wander(c, built, () => stopped)));
  return async () => {
    stopped = true;
    await Promise.all(runs);
  };
}
