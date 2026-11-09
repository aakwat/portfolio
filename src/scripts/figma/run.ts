import { createCast, dismiss } from "./cast";
import { heroScene } from "./scenes/hero";
import { navScene } from "./scenes/nav";

const root = document.documentElement;

async function play(): Promise<void> {
  const nav = document.querySelector<HTMLElement>('[data-fb-scene="nav"]');
  const hero = document.querySelector<HTMLElement>('[data-fb-scene="hero"]');
  if (!nav && !hero) return;
  const cast = createCast();
  try {
    // Both scenes build at once, like a team working in one file.
    await Promise.all([nav ? navScene(nav, cast) : null, hero ? heroScene(hero, cast) : null]);
  } finally {
    await dismiss(cast);
  }
}

// Reduced motion and no-JS visitors get the finished page; a failure must never leave layers hidden.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  root.classList.add("fb-on");
  void play().finally(() => root.classList.remove("fb-on"));
}
