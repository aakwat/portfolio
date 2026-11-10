import type { Cursor } from "./cursor";
import { isRendered, layer, place, rectOf, select, type Rect } from "./layer";
import { sleep, tween } from "./time";
import { reveal } from "./type";

const LOOK = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "textAlign"] as const;

function div(className: string, text = ""): HTMLElement {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  return el;
}

// Scoped styles don't reach the overlay, so the copy takes the computed look of a layer.
function wear(el: HTMLElement, from: HTMLElement): void {
  const cs = getComputedStyle(from);
  for (const p of LOOK) el.style[p] = cs[p];
}

function copyOf(src: HTMLElement): HTMLElement {
  const ghost = div("fb-ghost", src.textContent ?? "");
  wear(ghost, src);
  layer().append(ghost);
  return ghost;
}

// The copy's text at drag progress p (0..1): backspace the old text first, then type the new one.
export function textAt(from: string, to: string, p: number): string {
  const total = from.length + to.length;
  const step = Math.round(Math.min(1, Math.max(0, p)) * total);
  return step <= from.length ? from.slice(0, from.length - step) : to.slice(0, step - from.length);
}

// Renames the flying copy in step with the drag, with Figma's caret on it; it takes the destination's look once cleared.
function renamer(ghost: HTMLElement, dst: HTMLElement): (linear: number) => void {
  const from = ghost.textContent ?? "";
  const to = dst.textContent ?? "";
  const caret = document.createElement("span");
  caret.className = "fb-caret";
  let dressed = false;
  return (linear) => {
    // A short still moment at each end, so the grab and the drop read clearly.
    const p = (linear - 0.08) / 0.84;
    if (!dressed && p * (from.length + to.length) > from.length) {
      wear(ghost, dst);
      dressed = true;
    }
    ghost.textContent = textAt(from, to, p);
    if (linear < 1) ghost.append(caret);
  };
}

function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

// Figma's align bar: left, horizontal centres, vertical centres, distribute horizontal spacing.
function alignBar(): { el: HTMLElement; vcenter: HTMLElement; distribute: HTMLElement } {
  const el = div("fb-align");
  const icon = (kind: string, bars: number): HTMLElement => {
    const ico = div(`fb-ico fb-ico-${kind}`);
    for (let i = 0; i < bars; i++) ico.append(document.createElement("i"));
    el.append(ico);
    return ico;
  };
  icon("left", 2);
  icon("hcenter", 2);
  const vcenter = icon("vcenter", 2);
  const distribute = icon("distribute", 3);
  layer().append(el);
  return { el, vcenter, distribute };
}

// Alt-drags a copy of `src` straight onto `dst`, renaming it mid-flight; for layers placed by hand.
export async function copyAcross(c: Cursor, src: HTMLElement, dst: HTMLElement, ms = 1000): Promise<void> {
  if (!isRendered(src) || !isRendered(dst)) {
    reveal(dst);
    return;
  }
  const a = rectOf(src);
  const b = rectOf(dst);
  const ghost = copyOf(src);
  place(ghost, a);
  const off = select(ghost, c.person.tone, true, dst.dataset.fbName ?? "Layer");
  const grab = { x: a.w * 0.5, y: a.h * 0.5 };
  await c.to(a.x + grab.x, a.y + grab.y);
  c.hold(true);
  const rename = renamer(ghost, dst);
  const guides = snapGuides(dst.parentElement ?? dst);
  await tween(ms, (e, linear) => {
    const r = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, w: a.w, h: a.h };
    place(ghost, r);
    c.at(r.x + grab.x, r.y + grab.y);
    rename(linear);
    guides(r, linear);
  });
  c.hold(false);
  reveal(dst);
  ghost.remove();
  guides(null, 1);
  off();
}

// Figma's red smart guides, shown only as the copy nears its spot: the column's centre line,
// and the distance from the column top to the layer. Pass null to clear them.
function snapGuides(column: Element): (r: Rect | null, linear: number) => void {
  const col = rectOf(column);
  const centre = div("fb-guide");
  const measure = div("fb-guide");
  const pill = div("fb-pill");
  const parts = [centre, measure, pill];
  return (r, linear) => {
    if (!r) {
      for (const el of parts) el.remove();
      return;
    }
    const near = linear > 0.65;
    for (const el of parts) {
      if (near && !el.isConnected) layer().append(el);
      if (!near) el.remove();
    }
    if (!near) return;
    const cx = r.x + r.w / 2;
    place(centre, { x: cx, y: col.y, w: 1, h: col.h });
    const mx = r.x + r.w * 0.82;
    const h = Math.max(0, r.y - col.y);
    place(measure, { x: mx, y: col.y, w: 1, h });
    pill.textContent = String(Math.round(h));
    pill.style.left = `${mx}px`;
    pill.style.top = `${col.y + h / 2 - 8}px`;
  };
}

// Alt-drags a copy of `src` (renaming it as it moves), then aligns and spaces it with the align bar.
export async function duplicateAndAlign(c: Cursor, src: HTMLElement, dst: HTMLElement): Promise<void> {
  if (!isRendered(src) || !isRendered(dst)) {
    reveal(dst);
    return;
  }
  const a = rectOf(src);
  const b = rectOf(dst);
  const ghost = copyOf(src);
  const at = { x: a.x, y: a.y };
  const move = (x: number, y: number): void => {
    at.x = x;
    at.y = y;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
  };
  move(a.x, a.y);

  // Dropped slightly off on purpose, so the align step has something to fix.
  const grab = { x: a.w * 0.5, y: a.h * 0.6 };
  const drop = { x: b.x + 10, y: b.y + 8 };
  await c.to(a.x + grab.x, a.y + grab.y);
  c.hold(true);
  const rename = renamer(ghost, dst);
  await tween(1100, (e, linear) => {
    move(a.x + (drop.x - a.x) * e, a.y + (drop.y - a.y) * e);
    c.at(at.x + grab.x, at.y + grab.y);
    rename(linear);
  });
  c.hold(false);

  // Shift-select both: one selection around the pair, with the align bar beside it.
  await c.toEl(src, 0.5, 0.5);
  await c.click();
  await c.to(at.x + grab.x, at.y + grab.y);
  await c.click();
  const box = div(`fb-box fb-mine fb-tone-${c.person.tone}`);
  for (let i = 0; i < 4; i++) box.append(div("fb-handle"));
  layer().append(box);
  const bar = alignBar();
  const sync = (): void => {
    const u = union(a, rectOf(ghost));
    place(box, u, 2);
    bar.el.style.left = `${u.x}px`;
    // Above the selection like Figma, or below it when the layer is too close to the top.
    bar.el.style.top = `${u.y >= 52 ? u.y - 44 : u.y + u.h + 14}px`;
  };
  sync();
  await sleep(120);

  const cy = a.y + a.h / 2;
  await c.toEl(bar.vcenter);
  await c.click();
  bar.vcenter.classList.add("fb-on");
  const guide = div("fb-guide");
  layer().append(guide);
  const y0 = at.y;
  await tween(240, (e) => {
    move(at.x, y0 + (b.y - y0) * e);
    sync();
    place(guide, { x: a.x, y: cy, w: at.x + rectOf(ghost).w - a.x, h: 1 });
  });
  await sleep(140);
  bar.vcenter.classList.remove("fb-on");

  await c.toEl(bar.distribute);
  await c.click();
  bar.distribute.classList.add("fb-on");
  const gap = div("fb-gap");
  const pill = div("fb-pill");
  layer().append(gap, pill);
  const x0 = at.x;
  const left = a.x + a.w;
  await tween(240, (e) => {
    move(x0 + (b.x - x0) * e, at.y);
    sync();
    const w = at.x - left;
    place(gap, { x: left, y: cy, w, h: 1 });
    pill.textContent = String(Math.round(w));
    pill.style.left = `${left + w / 2}px`;
    pill.style.top = `${cy + 6}px`;
  });
  await sleep(220);
  for (const el of [guide, gap, pill, box, bar.el]) el.remove();

  reveal(dst);
  ghost.remove();
}
