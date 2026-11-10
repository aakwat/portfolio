import type { Rect } from "../core/geometry";

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

// Removes every overlay at once, so nothing is left behind even if a scene stopped early.
export function clearLayer(): void {
  root?.remove();
  root = null;
}

export function el(className: string, text = "", tag: "div" | "span" = "div"): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

export function rectOf(node: Element): Rect {
  const r = node.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

// False for layers hidden at this screen size (display: none), which cursors should skip.
export function isRendered(node: Element): boolean {
  return node.getClientRects().length > 0;
}

export function place(node: HTMLElement, r: Rect, pad = 0): void {
  node.style.left = `${r.x - pad}px`;
  node.style.top = `${r.y - pad}px`;
  node.style.width = `${r.w + pad * 2}px`;
  node.style.height = `${r.h + pad * 2}px`;
}

const LOOK = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "color", "textAlign"] as const;

// Scoped styles don't reach the overlay, so an overlay copy takes a layer's computed look.
export function copyLook(node: HTMLElement, from: Element): void {
  const cs = getComputedStyle(from);
  for (const p of LOOK) node.style[p] = cs[p];
}

// The name a layer shows in Figma's selection label.
export function labelOf(node: HTMLElement): string {
  return node.dataset.fbName ?? "Layer";
}
