import type { Rect } from "../core/geometry";
import type { Tone } from "../core/people";
import { el, layer, place, rectOf } from "../dom/overlay";

// Figma's selection outline. Mine: corner handles and a live size badge. Others: the layer name in their tone.
function outline(tone: Tone, mine: boolean, label?: string): { box: HTMLElement; badge: HTMLElement | null } {
  const box = el(`fb-box fb-tone-${tone}${mine ? " fb-mine" : ""}`);
  let badge: HTMLElement | null = null;
  if (mine) {
    for (let i = 0; i < 4; i++) box.append(el("fb-handle"));
    badge = el("fb-badge");
    box.append(badge);
  }
  if (label) box.append(el("fb-name", label));
  layer().append(box);
  return { box, badge };
}

interface Tracked {
  target: Element;
  box: HTMLElement;
  badge: HTMLElement | null;
}

// One frame loop keeps every tracked outline glued to its layer while it types, grows or moves.
const tracked = new Set<Tracked>();
let syncing = false;
function sync(): void {
  for (const t of tracked) {
    const r = rectOf(t.target);
    place(t.box, r, 1);
    if (t.badge) t.badge.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
  }
  if (tracked.size > 0) requestAnimationFrame(sync);
  else syncing = false;
}

// Selects a layer and follows it; returns the function that deselects it.
export function select(target: Element, tone: Tone, mine: boolean, label: string): () => void {
  const t = { target, ...outline(tone, mine, label) };
  tracked.add(t);
  if (!syncing) {
    syncing = true;
    requestAnimationFrame(sync);
  }
  return () => {
    tracked.delete(t);
    t.box.remove();
  };
}

// A selection drawn by hand around any rect, for multi-selections that span several layers.
export function selectionFrame(tone: Tone): { draw(r: Rect): void; remove(): void } {
  const { box } = outline(tone, true);
  return {
    draw: (r) => place(box, r, 2),
    remove: () => box.remove(),
  };
}
