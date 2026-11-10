import { wait } from "../dom/clock";
import { el } from "../dom/overlay";

// Real typing pace, deliberately not scaled by SPEED. Long copy types quicker so a paragraph
// takes about 1.5 s; much below ~10 ms a letter it stops reading as typing.
const SHORT_MS = 55;
const LONG_MS = 11;

// Figma's text caret; its width follows the font size so it shows on giant letters too.
export function caret(): HTMLElement {
  return el("fb-caret", "", "span");
}

export function reveal(node: Element): void {
  node.classList.add("fb-shown");
}

// Empties every text node of a layer, reveals it, then types it back with a caret.
export async function typeIn(node: HTMLElement): Promise<void> {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const texts: Array<[Text, string]> = [];
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (t instanceof Text && t.data.trim()) texts.push([t, t.data]);
  }
  for (const [t] of texts) t.data = "";
  reveal(node);

  const total = texts.reduce((sum, [, text]) => sum + text.length, 0);
  const per = total > 40 ? LONG_MS : SHORT_MS;
  const bar = caret();
  for (const [t, text] of texts) {
    t.after(bar);
    for (const ch of text) {
      t.data += ch;
      await wait(per * (0.6 + Math.random() * 0.8));
    }
  }
  bar.remove();
}
