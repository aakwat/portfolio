import { createCast, dismiss } from "./cast";
import { clearLayer } from "./dom/overlay";
import { heroScene } from "./scenes/hero";
import { navScene } from "./scenes/nav";

const scene = (name: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-fb-scene="${name}"]`);

// Overlays are cleared only when no scene is still building, since scenes can overlap.
let building = 0;
async function run(section: HTMLElement, play: () => Promise<void>): Promise<void> {
  building++;
  try {
    await play();
  } finally {
    // Shows the scene's layers even if it failed part way.
    section.dataset.fbDone = "";
    building--;
    if (building === 0) clearLayer();
  }
}

// Nav and hero build at once on load, like a team working in one file.
function opening(): void {
  const nav = scene("nav");
  const hero = scene("hero");
  if (!nav && !hero) return;
  const cast = createCast();
  void Promise.all([nav && run(nav, () => navScene(nav, cast)), hero && run(hero, () => heroScene(hero, cast))]).finally(
    () => dismiss(cast),
  );
}

// Sections below the fold build the first time they scroll into view.
function onFirstView(section: HTMLElement, play: (section: HTMLElement) => Promise<void>): void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      void run(section, () => play(section));
    },
    { threshold: 0.2 },
  );
  observer.observe(section);
}

// Reduced motion and no-JS visitors get the finished page.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("fb-on");
  opening();
  const work = scene("work");
  // Its code is fetched only when the section comes into view, keeping the first load small.
  if (work) onFirstView(work, async (section) => (await import("./scenes/work")).workScene(section));
  const contact = scene("contact");
  if (contact) onFirstView(contact, async (section) => (await import("./scenes/contact")).contactScene(section));
}
