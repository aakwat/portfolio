import { duplicateAndAlign } from "../actions/align";
import { build, tap } from "../actions/build";
import { job } from "../actions/job";
import { roam } from "../actions/roam";
import type { Cast } from "../cast";
import { sleep } from "../dom/clock";

// Aung selects the bar and types the name, Design fills the button, Dev types one link and copies it for the rest.
export async function navScene(nav: HTMLElement, cast: Cast): Promise<void> {
  const find = (name: string): HTMLElement[] => [...nav.querySelectorAll<HTMLElement>(`[data-fb="${name}"]`)];
  const stopRoaming = roam(cast.roamers, nav);

  const lead = async (): Promise<void> => {
    await tap(cast.lead, nav, { x: 0.02, y: 0.2 }, 500);
    for (const brand of find("brand")) {
      await build(cast.lead, brand, { mine: true, aim: { x: 0, y: 0.5 }, pace: { hold: 300 } });
    }
  };

  const design = async (): Promise<void> => {
    await sleep(600);
    for (const cta of find("cta")) {
      await build(cast.design, cta, { aim: { x: 0.15, y: 0.3 }, whileSelected: () => cast.design.chat("Button ready", 900) });
    }
  };

  const dev = async (): Promise<void> => {
    await sleep(900);
    const [first, ...rest] = find("link");
    if (!first) return;
    await build(cast.dev, first, { aim: { x: 0.3, y: 0.6 }, pace: { hold: 0 } });
    let prev = first;
    for (const link of rest) {
      await duplicateAndAlign(cast.dev, prev, link);
      prev = link;
    }
  };

  await Promise.all([job(cast.lead, lead), job(cast.design, design), job(cast.dev, dev)]);
  await stopRoaming();
}
