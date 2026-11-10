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
function enter(person: Person): Cursor {
  return new Cursor(person, {
    x: window.scrollX + between(0, window.innerWidth),
    y: window.scrollY + window.innerHeight - 40,
  });
}

// A small team called in later, for a scene that builds once it is scrolled to.
export function crew(...names: Person["name"][]): Cursor[] {
  return names.map((name) => {
    const person = PEOPLE.find((p) => p.name === name);
    if (!person) throw new Error(`no person ${name}`);
    return enter(person);
  });
}

export function createCast(): Cast {
  const all: Cursor[] = [];
  const join = (person: Person): Cursor => {
    const c = enter(person);
    all.push(c);
    return c;
  };
  const [aung, design, dev, qa, motion, brand, art, copy, ...crowd] = PEOPLE;
  return {
    lead: join(aung),
    design: join(design),
    dev: join(dev),
    roamers: [join(qa), join(motion)],
    brand: join(brand),
    art: join(art),
    copy: join(copy),
    crowd: crowd.map(join),
    all,
  };
}

export async function dismiss(cast: Cast): Promise<void> {
  await Promise.all(cast.all.map((c) => c.leave()));
}
