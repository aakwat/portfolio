import { build } from "../actions/build";
import { job } from "../actions/job";
import { roam } from "../actions/roam";
import { crew } from "../cast";
import { sleep } from "../dom/clock";

// Aung types the heading; Dev adds each role down the timeline while PM looks on.
export async function experienceScene(section: HTMLElement): Promise<void> {
  const find = (name: string): HTMLElement[] => [...section.querySelectorAll<HTMLElement>(`[data-fb="${name}"]`)];
  const [aung, dev, ...wanderers] = crew("Aung", "Dev", "PM");
  if (!aung || !dev) return;
  const stopRoaming = roam(wanderers, section, 600, 300);

  const heading = async (): Promise<void> => {
    for (const node of find("heading")) await build(aung, node, { mine: true, aim: { x: 0, y: 0.5 } });
  };
  const timeline = async (): Promise<void> => {
    await sleep(700);
    for (const node of find("role")) await build(dev, node, { aim: { x: 0.05, y: 0.2 } });
  };

  await Promise.all([job(aung, heading), job(dev, timeline)]);
  await stopRoaming();
}
