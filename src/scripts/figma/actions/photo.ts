import { pointIn } from "../core/geometry";
import { sleep, tween } from "../dom/clock";
import { el, isRendered, labelOf, layer, place, rectOf } from "../dom/overlay";
import type { Cursor } from "../ui/cursor";
import { select } from "../ui/selection";
import { reveal } from "../ui/typing";

// Drags a media frame out corner to corner with a live size badge, then drops the image or video in.
export async function drawPhoto(c: Cursor, img: HTMLElement, note?: string): Promise<void> {
  if (!isRendered(img)) {
    reveal(img);
    return;
  }
  const r = rectOf(img);
  await c.to(r);
  await c.click();
  const frame = el("fb-ph", img instanceof HTMLVideoElement ? "Video" : "Image");
  layer().append(frame);
  const off = select(frame, c.person.tone, true, labelOf(img));
  c.hold(true);
  await tween(700, (e) => {
    const grown = { x: r.x, y: r.y, w: r.w * e, h: r.h * e };
    place(frame, grown);
    c.at(pointIn(grown, 1, 1));
  });
  c.hold(false);
  if (note) await c.chat(note, 500);
  reveal(img);
  frame.classList.add("fb-fade");
  await sleep(450);
  off();
  frame.remove();
}
