// Real typing pace, deliberately not scaled by SPEED. Long copy types quicker so a paragraph
// takes about 1.5 s; much below ~10 ms a letter it stops reading as typing.
const SHORT_MS = 55;
const LONG_MS = 11;

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// Empties every text node of a layer, reveals it, then types it back with a caret.
export async function typeIn(el: HTMLElement): Promise<void> {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Array<[Text, string]> = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node instanceof Text && node.data.trim()) nodes.push([node, node.data]);
  }
  for (const [node] of nodes) node.data = "";
  reveal(el);

  const total = nodes.reduce((sum, [, text]) => sum + text.length, 0);
  const per = total > 40 ? LONG_MS : SHORT_MS;
  const caret = document.createElement("span");
  caret.className = "fb-caret";
  for (const [node, text] of nodes) {
    node.after(caret);
    for (const ch of text) {
      node.data += ch;
      await wait(per * (0.6 + Math.random() * 0.8));
    }
  }
  caret.remove();
}

export function reveal(el: Element): void {
  el.classList.add("fb-shown");
}
