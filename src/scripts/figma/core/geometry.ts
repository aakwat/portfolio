export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

// Point t along a quadratic curve from `a` to `b`, bowed sideways by `bend`, like a hand on a trackpad.
export function curvePoint(a: Point, b: Point, bend: number, t: number): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c = { x: a.x + dx / 2 - dy * bend, y: a.y + dy / 2 + dx * bend };
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

// The point a fraction (fx, fy) across a rect: 0.5, 0.5 is its centre.
export function pointIn(r: Rect, fx: number, fy: number): Point {
  return { x: r.x + r.w * fx, y: r.y + r.h * fy };
}
