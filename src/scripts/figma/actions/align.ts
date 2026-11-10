import { lerpPoint, pointIn, union, type Point } from "../core/geometry";
import { sleep, tween } from "../dom/clock";
import { isRendered, rectOf } from "../dom/overlay";
import { alignBar, type AlignAction } from "../ui/align-bar";
import type { Cursor } from "../ui/cursor";
import { guideLine, measure } from "../ui/guides";
import { selectionFrame } from "../ui/selection";
import { reveal } from "../ui/typing";
import { LayerCopy } from "./copy";

type Bar = ReturnType<typeof alignBar>;

// Clicks an align-bar icon and keeps it lit while its effect plays.
async function press(c: Cursor, bar: Bar, action: AlignAction, effect: () => Promise<void>): Promise<void> {
  await c.toEl(bar.icon(action));
  await c.click();
  bar.pressed(action, true);
  await effect();
  bar.pressed(action, false);
}

// Slides the copy to `to` on the axes given, calling `frame` each step to redraw what follows it.
function slide(copy: LayerCopy, to: Partial<Point>, frame: () => void): Promise<void> {
  const from = copy.rect;
  const end = { x: to.x ?? from.x, y: to.y ?? from.y };
  return tween(240, (e) => {
    copy.moveTo(lerpPoint(from, end, e));
    frame();
  });
}

// Copies `src` (renaming it in flight), drops it a little off, then aligns and spaces it with the align bar.
export async function duplicateAndAlign(c: Cursor, src: HTMLElement, dst: HTMLElement): Promise<void> {
  if (!isRendered(src) || !isRendered(dst)) {
    reveal(dst);
    return;
  }
  const a = rectOf(src);
  const b = rectOf(dst);
  const copy = new LayerCopy(src);
  // Dropped slightly off on purpose, so aligning has something to fix.
  await copy.fly(c, dst, { x: b.x + 10, y: b.y + 8 }, { ms: 1100, grabY: 0.6 });

  // Shift-select both: one selection around the pair, with the align bar beside it.
  await c.toEl(src);
  await c.click();
  await c.to(pointIn(copy.rect, 0.5, 0.6));
  await c.click();
  const frame = selectionFrame(c.person.tone);
  const bar = alignBar();
  const redraw = (): void => {
    const s = union(a, copy.rect);
    frame.draw(s);
    bar.placeAround(s);
  };
  redraw();
  await sleep(120);

  const midY = a.y + a.h / 2;
  const line = guideLine();
  await press(c, bar, "vcenter", async () => {
    await slide(copy, { y: b.y }, () => {
      redraw();
      line.draw({ x: a.x, y: midY, w: copy.rect.x + a.w - a.x, h: 1 });
    });
    await sleep(140);
  });

  const gap = measure("x");
  await press(c, bar, "distribute", async () => {
    await slide(copy, { x: b.x }, () => {
      redraw();
      gap.draw({ x: a.x + a.w, y: midY }, copy.rect.x - (a.x + a.w));
    });
    await sleep(220);
  });

  for (const overlay of [line, gap, frame, bar]) overlay.remove();
  copy.land(dst);
}
