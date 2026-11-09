import type { Tone } from "./people";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

let root: HTMLElement | null = null;

// One overlay root in page coordinates, clipped so cursors never widen the page.
export function layer(): HTMLElement {
  if (!root) {
    root = document.createElement("div");
    root.className = "fb-layer";
    root.setAttribute("aria-hidden", "true");
    document.body.append(root);
  }
  return root;
}

export function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

// False for layers hidden at this screen size (display: none), which cursors should skip.
export function isRendered(el: Element): boolean {
  return el.getClientRects().length > 0;
}

export function place(el: HTMLElement, r: Rect, pad = 0): void {
  el.style.left = `${r.x - pad}px`;
  el.style.top = `${r.y - pad}px`;
  el.style.width = `${r.w + pad * 2}px`;
  el.style.height = `${r.h + pad * 2}px`;
}

function make(className: string, text = ""): HTMLElement {
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  return el;
}

interface Tracked {
  target: Element;
  box: HTMLElement;
  badge: HTMLElement | null;
}

// Boxes follow their target every frame, so typing and drags keep them glued.
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
function track(t: Tracked): () => void {
  tracked.add(t);
  layer().append(t.box);
  if (!syncing) {
    syncing = true;
    requestAnimationFrame(sync);
  }
  return () => {
    tracked.delete(t);
    t.box.remove();
  };
}

// Mine: handles and a live size badge. Others: an outline in their tone with the layer name.
export function select(target: Element, tone: Tone, mine: boolean, label: string): () => void {
  const box = make(`fb-box fb-tone-${tone}${mine ? " fb-mine" : ""}`);
  let badge: HTMLElement | null = null;
  if (mine) {
    for (let i = 0; i < 4; i++) box.append(make("fb-handle"));
    badge = make("fb-badge");
    box.append(badge);
  }
  box.append(make("fb-name", label));
  return track({ target, box, badge });
}

export function hover(target: Element): () => void {
  return track({ target, box: make("fb-hover"), badge: null });
}
