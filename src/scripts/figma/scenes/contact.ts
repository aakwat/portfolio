import { build } from "../actions/build";
import { job } from "../actions/job";
import { penDraw, type Stroke } from "../actions/pen";
import { crew } from "../cast";
import { sleep } from "../dom/clock";

// Aung types the sign-off, Copy adds the contact links, Art draws the portrait with the pen tool.
export async function contactScene(section: HTMLElement): Promise<void> {
  const find = (name: string): HTMLElement[] => [...section.querySelectorAll<HTMLElement>(`[data-fb="${name}"]`)];
  const [aung, copy, art] = crew("Aung", "Copy", "Art");
  if (!aung || !copy || !art) return;
  const drawing = section.querySelector<SVGSVGElement>('svg[data-fb="avatar"]');
  const stroke = (cls: string, ms: number, anchors: number, fill = false): Stroke[] =>
    [...section.querySelectorAll<SVGPathElement>(`.pen.${cls}`)].map((path) => ({ path, ms, anchors, fill }));

  const signOff = async (): Promise<void> => {
    for (const node of find("heading")) await build(aung, node, { mine: true, aim: { x: 0, y: 0.5 } });
    for (const node of find("intro")) await build(aung, node);
  };
  const links = async (): Promise<void> => {
    await sleep(1400);
    for (const node of [...find("mail"), ...find("links")]) await build(copy, node, { aim: { x: 0.1, y: 0.5 } });
  };
  // Hair loops first, then the face line, the shirt outline, and the shirt filled in pen strokes.
  const portrait = async (): Promise<void> => {
    if (!drawing) return;
    await sleep(300);
    await penDraw(art, drawing, [
      ...stroke("hair", 1800, 16),
      ...stroke("face", 1000, 8),
      ...stroke("shirt", 1000, 8),
      ...stroke("fill", 2600, 0, true),
    ]);
  };

  await Promise.all([job(aung, signOff), job(copy, links), job(art, portrait)]);
}
