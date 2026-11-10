import { build } from "../actions/build";
import { copyCard } from "../actions/copy-card";
import { job } from "../actions/job";
import { drawPhoto } from "../actions/photo";
import { roam } from "../actions/roam";
import { crew } from "../cast";
import { sleep } from "../dom/clock";

// Aung types the heading, Art and Copy build the featured project, Design and Dev build the cards.
export async function workScene(section: HTMLElement): Promise<void> {
  const find = (name: string): HTMLElement[] => [...section.querySelectorAll<HTMLElement>(`[data-fb="${name}"]`)];
  const [aung, art, copy, design, dev, ...wanderers] = crew("Aung", "Art", "Copy", "Design", "Dev", "PM", "UX");
  if (!aung || !art || !copy || !design || !dev) return;
  const [featureMedia] = find("media");
  const [featureInfo] = find("info");
  const stopRoaming = roam(wanderers, section, 700, 300);

  const heading = async (): Promise<void> => {
    for (const node of find("heading")) await build(aung, node, { mine: true, aim: { x: 0, y: 0.5 } });
    for (const node of find("intro")) await build(aung, node);
  };
  const featureFrame = async (): Promise<void> => {
    await sleep(300);
    if (featureMedia) await drawPhoto(art, featureMedia, "Demo video in");
  };
  const featureText = async (): Promise<void> => {
    await sleep(700);
    if (featureInfo) await build(copy, featureInfo, { aim: { x: 0.1, y: 0.1 } });
  };
  // Card one is built in full; each next card is a copy of the one before, retyped in flight.
  const cards = [...section.querySelectorAll<HTMLElement>("[data-fb-card]")];
  const firstCard = async (): Promise<void> => {
    const [first] = cards;
    if (!first) return;
    const media = first.querySelector<HTMLElement>('[data-fb="media"]');
    const info = first.querySelector<HTMLElement>('[data-fb="info"]');
    await sleep(900);
    await Promise.all([
      media ? job(design, () => drawPhoto(design, media)) : design.leave(),
      info ? sleep(500).then(() => build(dev, info, { aim: { x: 0.1, y: 0.1 } })) : null,
    ]);
  };
  const cardsWork = async (): Promise<void> => {
    await firstCard();
    for (const [i, card] of cards.entries()) {
      const prev = cards[i - 1];
      if (prev) await copyCard(dev, prev, card);
    }
  };

  await Promise.all([
    job(aung, heading),
    job(art, featureFrame),
    job(copy, featureText),
    job(dev, cardsWork),
  ]);
  await stopRoaming();
}
