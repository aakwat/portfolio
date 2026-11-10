import { build, QUICK } from "../actions/build";
import { copyAcross } from "../actions/copy";
import { job } from "../actions/job";
import { drawPhoto } from "../actions/photo";
import { roam } from "../actions/roam";
import type { Cast } from "../cast";
import { deferred } from "../core/deferred";
import { sleep } from "../dom/clock";

// Brand types A and copies it across as U, N, G; Art draws the photo and greeting; Copy types the caption.
export async function heroScene(hero: HTMLElement, cast: Cast): Promise<void> {
  const find = (name: string): HTMLElement[] => [...hero.querySelectorAll<HTMLElement>(`[data-fb="${name}"]`)];
  // The letter over the photo is cut in page colour, so it only shows once the photo is behind it.
  const photoLanded = deferred();
  const besidePhoto = (node: HTMLElement): boolean => node.parentElement?.querySelector('[data-fb="photo"]') != null;
  const stopRoaming = roam(cast.crowd, hero, 500, 250);

  const letters = async (): Promise<void> => {
    await sleep(200);
    const [first, ...rest] = find("glyph");
    if (first) {
      await build(cast.brand, first, { pace: QUICK });
      let prev = first;
      for (const glyph of rest) {
        if (besidePhoto(glyph)) await photoLanded.promise;
        await copyAcross(cast.brand, prev, glyph);
        prev = glyph;
      }
    }
    for (const wave of find("wave")) await build(cast.brand, wave, { pace: QUICK });
  };

  const art = async (): Promise<void> => {
    await sleep(400);
    try {
      for (const photo of find("photo")) await drawPhoto(cast.art, photo, "Dropping the photo in");
    } finally {
      photoLanded.resolve();
    }
    for (const hello of find("hello")) await build(cast.art, hello);
  };

  const copy = async (): Promise<void> => {
    await sleep(900);
    for (const name of ["name", "summary", "link", "copyright"]) {
      for (const node of find(name)) await build(cast.copy, node);
    }
  };

  await Promise.all([job(cast.brand, letters), job(cast.art, art), job(cast.copy, copy)]);
  await stopRoaming();
}
