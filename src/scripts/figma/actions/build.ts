import type { Point } from "../core/geometry";
import { sleep } from "../dom/clock";
import { isRendered, labelOf } from "../dom/overlay";
import type { Cursor } from "../ui/cursor";
import { select } from "../ui/selection";
import { reveal, typeIn } from "../ui/typing";

export interface Pace {
  move?: number;
  hold: number;
}
export const NORMAL: Pace = { hold: 150 };
// For single-character layers, where the time is all travel and pause.
export const QUICK: Pace = { move: 320, hold: 60 };

export interface BuildOptions {
  pace?: Pace;
  mine?: boolean;
  aim?: Point;
  // Runs while the layer is still selected, in place of the pace's hold.
  whileSelected?: () => Promise<void>;
}

// Clicks a layer, selects it in the cursor's colour and types it in. Layers hidden at this size just appear.
export async function build(c: Cursor, node: HTMLElement, opts: BuildOptions = {}): Promise<void> {
  if (!isRendered(node)) {
    reveal(node);
    return;
  }
  const { pace = NORMAL, mine = false, aim = { x: 0.2, y: 0.5 } } = opts;
  await c.toEl(node, aim.x, aim.y, pace.move);
  await c.click();
  const off = select(node, c.person.tone, mine, labelOf(node));
  await typeIn(node);
  await (opts.whileSelected ? opts.whileSelected() : sleep(pace.hold));
  off();
}

// Clicks a layer and holds the selection a moment, without changing it.
export async function tap(c: Cursor, node: HTMLElement, aim: Point, ms: number): Promise<void> {
  if (!isRendered(node)) return;
  await c.toEl(node, aim.x, aim.y);
  await c.click();
  const off = select(node, c.person.tone, true, labelOf(node));
  await sleep(ms);
  off();
}
