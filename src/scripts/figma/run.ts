import { createCast, dismiss } from "./cast";
import { navScene } from "./scenes/nav";

const root = document.documentElement;

async function play(): Promise<void> {
  const nav = document.querySelector<HTMLElement>('[data-fb-scene="nav"]');
  if (!nav) return;
  const cast = createCast();
  try {
    await navScene(nav, cast);
  } finally {
    await dismiss(cast);
  }
}

// Reduced motion and no-JS visitors get the finished page; a failure must never leave layers hidden.
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  root.classList.add("fb-on");
  void play().finally(() => root.classList.remove("fb-on"));
}
