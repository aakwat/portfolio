import { copyAcross } from "../align";
import { wander, type Cast } from "../cast";
import type { Cursor } from "../cursor";
import { isRendered, layer, place, rectOf, select } from "../layer";
import { sleep, tween } from "../time";
import { reveal, typeIn } from "../type";

interface Pace {
  move?: number;
  hold: number;
}
const NORMAL: Pace = { hold: 150 };
// The big letters are single characters, so the time is all travel and pause; keep both short.
const QUICK: Pace = { move: 320, hold: 60 };

// Clicks a layer, selects it in the cursor's colour and types it in. Layers hidden at this size just appear.
async function build(c: Cursor, el: HTMLElement, pace: Pace = NORMAL): Promise<void> {
  if (!isRendered(el)) {
    reveal(el);
    return;
  }
  await c.toEl(el, 0.2, 0.5, pace.move);
  await c.click();
  const off = select(el, c.person.tone, false, el.dataset.fbName ?? "Layer");
  await typeIn(el);
  await sleep(pace.hold);
  off();
}

// Drags an image frame out corner to corner with a live size badge, then drops the photo in.
async function drawPhoto(c: Cursor, img: HTMLElement): Promise<void> {
  if (!isRendered(img)) {
    reveal(img);
    return;
  }
  const r = rectOf(img);
  await c.to(r.x, r.y);
  await c.click();
  const frame = document.createElement("div");
  frame.className = "fb-ph";
  frame.textContent = "Image";
  layer().append(frame);
  const off = select(frame, c.person.tone, true, "Portrait");
  c.hold(true);
  await tween(700, (e) => {
    const w = r.w * e;
    const h = r.h * e;
    place(frame, { x: r.x, y: r.y, w, h });
    c.at(r.x + w, r.y + h);
  });
  c.hold(false);
  await c.chat("Dropping the photo in", 500);
  reveal(img);
  frame.classList.add("fb-fade");
  await sleep(450);
  off();
  frame.remove();
}

// Brand types the letters, Art draws the photo and greeting, Copy types the caption.
export async function heroScene(hero: HTMLElement, cast: Cast): Promise<void> {
  const one = (name: string): HTMLElement | null => hero.querySelector<HTMLElement>(`[data-fb="${name}"]`);
  const glyphs = [...hero.querySelectorAll<HTMLElement>('[data-fb="glyph"]')];
  // The letter over the photo is cut in page colour, so it is invisible until the photo lands.
  let photoLanded = (): void => {};
  const photoReady = new Promise<void>((resolve) => (photoLanded = resolve));

  // The crowd drifts over whatever is already built, until the main three finish.
  let done = false;
  const built = (): Element[] => [...hero.querySelectorAll(".fb-shown")].filter(isRendered);
  const roam = cast.crowd.map((c, i) => sleep(500 + i * 250).then(() => wander(c, built, () => done)));

  const letters = async (): Promise<void> => {
    await sleep(200);
    // Type the first letter once, then copy it column to column, renaming it in flight.
    const [first, ...rest] = glyphs;
    if (first) {
      await build(cast.brand, first, QUICK);
      let prev = first;
      for (const g of rest) {
        if (g.closest(".photo-col")) await photoReady;
        await copyAcross(cast.brand, prev, g);
        prev = g;
      }
    }
    const wave = one("wave");
    if (wave) await build(cast.brand, wave, QUICK);
  };

  const art = async (): Promise<void> => {
    await sleep(400);
    const photo = one("photo");
    try {
      if (photo) await drawPhoto(cast.art, photo);
    } finally {
      photoLanded();
    }
    const hello = one("hello");
    if (hello) await build(cast.art, hello);
  };

  const copy = async (): Promise<void> => {
    await sleep(900);
    for (const name of ["name", "summary", "link", "copyright"]) {
      const el = one(name);
      if (el) await build(cast.copy, el);
    }
  };

  await Promise.all([letters(), art(), copy()]);
  done = true;
  await Promise.all(roam);
}
