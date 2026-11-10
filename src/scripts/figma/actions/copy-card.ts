import { lerpPoint } from "../core/geometry";
import { textAt } from "../core/text";
import { tween } from "../dom/clock";
import { isRendered, labelOf, layer, place, rectOf } from "../dom/overlay";
import type { Cursor } from "../ui/cursor";
import { measure } from "../ui/guides";
import { select } from "../ui/selection";
import { caret, reveal } from "../ui/typing";

// The gap guide shows only as the copy nears its slot, which is when Figma snaps.
const SNAP_AT = 0.65;
// The media swaps at the midpoint of the drag.
const SWAP_AT = 0.5;

const mediaOf = (card: Element): HTMLElement | null => card.querySelector<HTMLElement>('[data-fb="media"]');

// A still look-alike of a whole card. Cloning keeps Astro's scoped style attributes, so it looks the same.
function ghostOf(card: HTMLElement): HTMLElement {
  const ghost = card.cloneNode(true);
  if (!(ghost instanceof HTMLElement)) throw new Error("card did not clone as an element");
  for (const node of ghost.querySelectorAll("[id],[data-fb],[data-autoplay],[data-fb-card]")) {
    node.removeAttribute("id");
    node.removeAttribute("data-fb");
    node.removeAttribute("data-autoplay");
  }
  ghost.classList.add("fb-card-ghost");
  layer().append(ghost);
  return ghost;
}

function firstText(root: Element | null): Text | null {
  if (!root) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node instanceof Text && node.data.trim()) return node;
  }
  return null;
}

// A text in the copy that retypes from its old words to the next card's, with the caret on it.
function retyper(ghost: HTMLElement, dst: HTMLElement, selector: string): (t: number) => void {
  const node = firstText(ghost.querySelector(selector));
  const to = firstText(dst.querySelector(selector))?.data.trim();
  if (!node || to === undefined) return () => {};
  const from = node.data.trim();
  const bar = caret();
  return (t) => {
    node.data = textAt(from, to, (t - 0.08) / 0.84);
    if (t < 1) node.after(bar);
    else bar.remove();
  };
}

// Alt-drags a copy of the finished card `src` to card `dst`: its title and line retype and its
// media swaps in flight, a gap guide shows as it snaps, then the real card takes over.
export async function copyCard(c: Cursor, src: HTMLElement, dst: HTMLElement): Promise<void> {
  const layers = [...dst.querySelectorAll<HTMLElement>("[data-fb]")];
  if (!isRendered(src) || !isRendered(dst)) {
    for (const node of layers) reveal(node);
    return;
  }
  const a = rectOf(src);
  const b = rectOf(dst);
  const ghost = ghostOf(src);
  place(ghost, a);
  const off = select(ghost, c.person.tone, true, labelOf(dst));
  const title = retyper(ghost, dst, "h3");
  const line = retyper(ghost, dst, ".line");
  const gap = measure("x");
  let swapped = false;
  const grab = { x: a.w * 0.5, y: a.h * 0.3 };

  await c.to({ x: a.x + grab.x, y: a.y + grab.y });
  c.hold(true);
  await tween(1400, (e, t) => {
    const at = lerpPoint(a, b, e);
    place(ghost, { ...at, w: a.w, h: a.h });
    c.at({ x: at.x + grab.x, y: at.y + grab.y });
    title(t);
    line(t);
    if (!swapped && t > SWAP_AT) {
      const own = mediaOf(src) ? ghost.querySelector(".frame > :is(video, img)") : null;
      const next = mediaOf(dst)?.cloneNode(true);
      if (own && next instanceof HTMLElement) {
        next.removeAttribute("data-fb");
        next.removeAttribute("data-autoplay");
        own.replaceWith(next);
      }
      swapped = true;
    }
    if (t > SNAP_AT) gap.draw({ x: a.x + a.w, y: at.y + a.h * 0.25 }, at.x - (a.x + a.w));
  });
  c.hold(false);

  for (const node of layers) reveal(node);
  gap.remove();
  ghost.remove();
  off();
}
