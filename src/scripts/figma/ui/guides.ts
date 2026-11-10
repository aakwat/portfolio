import type { Point, Rect } from "../core/geometry";
import { el, layer, place } from "../dom/overlay";

export interface Overlay {
  remove(): void;
}

function mount(node: HTMLElement): void {
  if (!node.isConnected) layer().append(node);
}

// A red smart-guide line.
export function guideLine(): Overlay & { draw(r: Rect): void } {
  const line = el("fb-guide");
  return {
    draw: (r) => {
      mount(line);
      place(line, r);
    },
    remove: () => line.remove(),
  };
}

// A red distance measure with its value in px: across (x) with end ticks, or down (y).
export function measure(axis: "x" | "y"): Overlay & { draw(start: Point, length: number): void } {
  const line = el(axis === "x" ? "fb-gap" : "fb-guide");
  const pill = el("fb-pill");
  return {
    draw: (start, length) => {
      mount(line);
      mount(pill);
      const len = Math.max(0, length);
      place(line, axis === "x" ? { ...start, w: len, h: 1 } : { ...start, w: 1, h: len });
      pill.textContent = String(Math.round(len));
      pill.style.left = `${axis === "x" ? start.x + len / 2 : start.x}px`;
      pill.style.top = `${axis === "x" ? start.y + 6 : start.y + len / 2 - 8}px`;
    },
    remove: () => {
      line.remove();
      pill.remove();
    },
  };
}

// Guides a layer snaps to inside its column: the centre line and the distance from the column top.
export function columnGuides(column: Rect): Overlay & { draw(r: Rect): void } {
  const axis = guideLine();
  const height = measure("y");
  return {
    draw: (r) => {
      axis.draw({ x: r.x + r.w / 2, y: column.y, w: 1, h: column.h });
      height.draw({ x: r.x + r.w * 0.82, y: column.y }, r.y - column.y);
    },
    remove: () => {
      axis.remove();
      height.remove();
    },
  };
}
