import type { Point } from "../core/geometry";
import type { Tone } from "../core/people";
import { el, layer } from "../dom/overlay";

const HANDLE = 22;

function put(node: HTMLElement, p: Point): void {
  node.style.transform = `translate(${p.x}px, ${p.y}px)`;
}

// Figma's vector edit marks: anchors left along the path, and the live point with its two bezier handles.
export function penMarks(tone: Tone): { anchor(p: Point): void; tip(p: Point, dir: Point): void; clear(): void } {
  const box = el(`fb-pen fb-tone-${tone}`);
  const bar = el("fb-pen-bar");
  const ends = [el("fb-pen-end"), el("fb-pen-end")];
  const live = el("fb-pen-anchor fb-pen-live");
  box.append(bar, ...ends, live);
  layer().append(box);
  return {
    anchor(p) {
      const a = el("fb-pen-anchor");
      put(a, p);
      box.insertBefore(a, bar);
    },
    tip(p, dir) {
      const len = Math.hypot(dir.x, dir.y) || 1;
      const ux = (dir.x / len) * HANDLE;
      const uy = (dir.y / len) * HANDLE;
      put(live, p);
      const [back, front] = ends;
      if (back) put(back, { x: p.x - ux, y: p.y - uy });
      if (front) put(front, { x: p.x + ux, y: p.y + uy });
      bar.style.transform = `translate(${p.x - ux}px, ${p.y - uy}px) rotate(${Math.atan2(uy, ux)}rad)`;
    },
    clear() {
      box.remove();
    },
  };
}

// The right-hand Fill panel, shown while a shape is being filled.
export function fillPanel(at: Point, tone: Tone): () => void {
  const panel = el(`fb-fill fb-tone-${tone}`);
  panel.append(el("fb-fill-title", "Fill", "span"), el("fb-fill-swatch", "", "span"), el("fb-fill-hex", "Ink  100%", "span"));
  put(panel, at);
  layer().append(panel);
  return () => panel.remove();
}
