import type { Point } from "../core/geometry";
import { tween } from "../dom/clock";
import { rectOf } from "../dom/overlay";
import type { Cursor } from "../ui/cursor";
import { fillPanel, penMarks } from "../ui/pen-marks";
import { select } from "../ui/selection";
import { reveal } from "../ui/typing";

// Page position of a point along a path, `at` from 0 to 1.
function tip(path: SVGPathElement, at: number): Point {
  const p = path.getPointAtLength(Math.min(1, Math.max(0, at)) * path.getTotalLength());
  const m = path.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const s = new DOMPoint(p.x, p.y).matrixTransform(m);
  return { x: s.x + window.scrollX, y: s.y + window.scrollY };
}

export interface Stroke {
  path: SVGPathElement;
  ms: number;
  // Anchor points dropped along the way; 0 for fill strokes.
  anchors: number;
  // Shows the Fill panel, left of the drawing, while this stroke is drawn.
  fill?: boolean;
}

// Pen tool: the cursor draws each stroke, dropping anchors and steering bezier handles like Figma.
export async function penDraw(c: Cursor, drawing: SVGSVGElement, strokes: readonly Stroke[]): Promise<void> {
  // The gap is longer than the path, so no end peeks out before its turn (dash lengths are not exact here).
  for (const { path } of strokes) {
    path.style.strokeDasharray = "1 3";
    path.style.strokeDashoffset = "1";
  }
  reveal(drawing);
  const first = strokes[0];
  if (first) await c.to(tip(first.path, 0));
  await c.click();
  const off = select(drawing, c.person.tone, false, drawing.dataset.fbName ?? "Vector");
  await c.chat("Pen tool", 500);
  for (const { path, ms, anchors, fill } of strokes) {
    await c.to(tip(path, 0), 260);
    const marks = anchors > 0 ? penMarks(c.person.tone) : null;
    const box = rectOf(drawing);
    const closePanel = fill
      ? fillPanel({ x: Math.max(window.scrollX + 8, box.x - 130), y: box.y + box.h * 0.55 }, c.person.tone)
      : null;
    let dropped = 0;
    c.hold(true);
    await tween(ms, (_eased, t) => {
      path.style.strokeDashoffset = String(1 - t);
      const here = tip(path, t);
      c.at(here);
      if (!marks) return;
      while (dropped < anchors && dropped / anchors <= t) marks.anchor(tip(path, dropped++ / anchors));
      const ahead = tip(path, t + 0.01);
      marks.tip(here, { x: ahead.x - here.x, y: ahead.y - here.y });
    });
    path.style.strokeDasharray = "";
    path.style.strokeDashoffset = "";
    c.hold(false);
    marks?.clear();
    closePanel?.();
  }
  off();
}
