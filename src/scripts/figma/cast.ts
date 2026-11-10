import { PEOPLE, type Person } from "./core/people";
import { between } from "./core/random";
import { Cursor } from "./ui/cursor";

export interface Cast {
  lead: Cursor;
  design: Cursor;
  dev: Cursor;
  // Wander over the Nav.
  roamers: Cursor[];
  brand: Cursor;
  art: Cursor;
  copy: Cursor;
  // Wander over the hero.
  crowd: Cursor[];
  // Everyone created, so none is ever left behind on screen.
  all: Cursor[];
}

// Everyone enters from the bottom edge of what the visitor can see.
export function createCast(): Cast {
  const all: Cursor[] = [];
  const enter = (person: Person): Cursor => {
    const c = new Cursor(person, {
      x: window.scrollX + between(0, window.innerWidth),
      y: window.scrollY + window.innerHeight - 40,
    });
    all.push(c);
    return c;
  };
  const [aung, design, dev, qa, motion, brand, art, copy, ...crowd] = PEOPLE;
  return {
    lead: enter(aung),
    design: enter(design),
    dev: enter(dev),
    roamers: [enter(qa), enter(motion)],
    brand: enter(brand),
    art: enter(art),
    copy: enter(copy),
    crowd: crowd.map(enter),
    all,
  };
}

export async function dismiss(cast: Cast): Promise<void> {
  await Promise.all(cast.all.map((c) => c.leave()));
}
