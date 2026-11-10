import { lerpPoint, type Point, type Rect } from "../core/geometry";
import { isTypingNew, textAt } from "../core/text";
import { tween } from "../dom/clock";
import { copyLook, el, isRendered, labelOf, layer, place, rectOf } from "../dom/overlay";
import type { Cursor } from "../ui/cursor";
import { columnGuides } from "../ui/guides";
import { select } from "../ui/selection";
import { caret, reveal } from "../ui/typing";

// Guides show only as the copy nears its spot, which is when Figma snaps.
const SNAP_AT = 0.65;

// Renames the copy in step with the drag, caret on throughout; it takes the destination's look once its text starts.
function renamer(node: HTMLElement, dst: HTMLElement): (t: number) => void {
  const from = node.textContent ?? "";
  const to = dst.textContent ?? "";
  const bar = caret();
  let dressed = false;
  return (t) => {
    // A still moment at each end, so the grab and the drop read clearly.
    const p = (t - 0.08) / 0.84;
    if (!dressed && isTypingNew(from, to, p)) {
      copyLook(node, dst);
      dressed = true;
    }
    node.textContent = textAt(from, to, p);
    if (t < 1) node.append(bar);
  };
}

interface FlyOptions {
  ms: number;
  grabY?: number;
  onFrame?: (r: Rect, t: number) => void;
}

// A floating overlay copy of a text layer, as when Alt-dragging in Figma.
export class LayerCopy {
  readonly node: HTMLElement;
  private readonly w: number;
  private readonly h: number;
  private pos: Point;

  constructor(src: HTMLElement) {
    const r = rectOf(src);
    this.node = el("fb-ghost", src.textContent ?? "");
    copyLook(this.node, src);
    layer().append(this.node);
    this.w = r.w;
    this.h = r.h;
    this.pos = r;
    this.moveTo(r);
  }

  get rect(): Rect {
    return { x: this.pos.x, y: this.pos.y, w: this.w, h: this.h };
  }

  moveTo(p: Point): void {
    this.pos = { x: p.x, y: p.y };
    place(this.node, this.rect);
  }

  // Drags the copy to `to`, typing the destination's text into it on the way.
  async fly(c: Cursor, dst: HTMLElement, to: Point, opts: FlyOptions): Promise<void> {
    const from = this.pos;
    const grab = { x: this.w * 0.5, y: this.h * (opts.grabY ?? 0.5) };
    await c.to({ x: from.x + grab.x, y: from.y + grab.y });
    c.hold(true);
    const rename = renamer(this.node, dst);
    await tween(opts.ms, (e, t) => {
      this.moveTo(lerpPoint(from, to, e));
      c.at({ x: this.pos.x + grab.x, y: this.pos.y + grab.y });
      rename(t);
      opts.onFrame?.(this.rect, t);
    });
    c.hold(false);
  }

  // The real layer takes over where the copy landed.
  land(dst: HTMLElement): void {
    reveal(dst);
    this.node.remove();
  }
}

// Copies `src` straight onto `dst`, renaming it in flight, with snap guides near the end.
export async function copyAcross(c: Cursor, src: HTMLElement, dst: HTMLElement, ms = 1000): Promise<void> {
  if (!isRendered(src) || !isRendered(dst)) {
    reveal(dst);
    return;
  }
  const copy = new LayerCopy(src);
  const off = select(copy.node, c.person.tone, true, labelOf(dst));
  const guides = columnGuides(rectOf(dst.parentElement ?? dst));
  await copy.fly(c, dst, rectOf(dst), {
    ms,
    onFrame: (r, t) => (t > SNAP_AT ? guides.draw(r) : guides.remove()),
  });
  copy.land(dst);
  guides.remove();
  off();
}
