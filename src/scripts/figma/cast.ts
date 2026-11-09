import { Cursor } from "./cursor";
import { select } from "./layer";
import { NOTES, PEOPLE } from "./people";
import { sleep } from "./time";

export interface Cast {
  lead: Cursor;
  design: Cursor;
  dev: Cursor;
  roamers: Cursor[];
  brand: Cursor;
  art: Cursor;
  copy: Cursor;
}

function pick<T>(list: readonly T[]): T {
  const item = list[Math.floor(Math.random() * list.length)];
  if (item === undefined) throw new Error("pick from an empty list");
  return item;
}

// Cursors enter from the bottom edge of what the visitor can see.
export function createCast(): Cast {
  const [aung, design, dev, qa, motion, brand, art, copy] = PEOPLE;
  const enter = (person: (typeof PEOPLE)[number]): Cursor =>
    new Cursor(person, window.scrollX + Math.random() * window.innerWidth, window.scrollY + window.innerHeight - 40);
  return {
    lead: enter(aung),
    design: enter(design),
    dev: enter(dev),
    roamers: [enter(qa), enter(motion)],
    brand: enter(brand),
    art: enter(art),
    copy: enter(copy),
  };
}

export function everyone(cast: Cast): Cursor[] {
  return [cast.lead, cast.design, cast.dev, ...cast.roamers, cast.brand, cast.art, cast.copy];
}

// Background collaborators: drift to whatever is on the canvas, sometimes select it or leave a note.
export async function wander(cursor: Cursor, targets: () => Element[], until: () => boolean): Promise<void> {
  while (!until()) {
    const shown = targets();
    if (shown.length === 0) {
      await sleep(200);
      continue;
    }
    const target = pick(shown);
    await cursor.toEl(target, 0.15 + Math.random() * 0.7, 0.2 + Math.random() * 0.6);
    if (until()) break;
    let off: (() => void) | null = null;
    if (Math.random() < 0.55) {
      await cursor.click();
      off = select(target, cursor.person.tone, false, target.getAttribute("data-fb-name") ?? "Layer");
    }
    if (Math.random() < 0.25) await cursor.chat(pick(NOTES), 900);
    else await cursor.idle(300 + Math.random() * 500);
    off?.();
  }
}

export function dismiss(cast: Cast): Promise<void[]> {
  return Promise.all(everyone(cast).map((c) => c.leave()));
}
