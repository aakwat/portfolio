import { duplicateAndAlign } from "../align";
import { wander, type Cast } from "../cast";
import { isRendered, select } from "../layer";
import { sleep } from "../time";
import { reveal, typeIn } from "../type";

// Aung selects the bar and types the name, Design fills the button, Dev builds the links.
export async function navScene(nav: HTMLElement, cast: Cast): Promise<void> {
  const brand = nav.querySelector<HTMLElement>('[data-fb="brand"]');
  const cta = nav.querySelector<HTMLElement>('[data-fb="cta"]');
  const links = [...nav.querySelectorAll<HTMLElement>('[data-fb="link"]')];
  if (!brand || !cta) return;

  let done = false;
  const shown = (): Element[] => [...nav.querySelectorAll(".fb-shown")];
  const roam = cast.roamers.map((c, i) => sleep(300 + i * 300).then(() => wander(c, shown, () => done)));

  const lead = async (): Promise<void> => {
    await cast.lead.toEl(nav, 0.02, 0.2);
    await cast.lead.click();
    const offBar = select(nav, "blue", true, "Nav");
    await sleep(500);
    offBar();
    await cast.lead.toEl(brand, 0, 0.5);
    await cast.lead.click();
    const off = select(brand, "blue", true, "Name");
    await typeIn(brand);
    await sleep(300);
    off();
  };

  const design = async (): Promise<void> => {
    await sleep(600);
    await cast.design.toEl(cta, 0.15, 0.3);
    await cast.design.click();
    const off = select(cta, "purple", false, "Button");
    await typeIn(cta);
    await cast.design.chat("Button ready", 900);
    off();
  };

  // Dev types the first link, then duplicates and aligns it for each of the others, as in Figma.
  const dev = async (): Promise<void> => {
    await sleep(900);
    const [first, ...rest] = links;
    if (!first) return;
    if (isRendered(first)) {
      await cast.dev.toEl(first, 0.3, 0.6);
      await cast.dev.click();
      const off = select(first, "green", false, first.dataset.fbName ?? "Link");
      await typeIn(first);
      off();
    } else {
      reveal(first);
    }
    let prev = first;
    for (const link of rest) {
      await duplicateAndAlign(cast.dev, prev, link);
      prev = link;
    }
  };

  await Promise.all([lead(), design(), dev()]);
  done = true;
  await Promise.all(roam);
}
