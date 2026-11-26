// Glass droplets on the nav and the phone menu; picking a menu link closes the menu (Esc and outside taps are the
// popover's own).
import { attachDrop } from "@aakwat/liquid-glass";

const nav = document.querySelector<HTMLElement>(".nav nav");
const menu = document.getElementById("nav-menu");
const still = window.matchMedia("(prefers-reduced-motion: reduce)");

if (nav) attachDrop(nav, "a, button");

if (menu) {
  const drop = attachDrop(menu, "a", { rest: true });
  menu.addEventListener("toggle", (event) => {
    if (!(event instanceof ToggleEvent)) return;
    // Cleared on close, so the next open snaps to the first item instead of gliding there.
    if (event.newState === "open") drop.place(menu.querySelector<HTMLElement>("a"));
    else delete menu.dataset.dropOn;
  });
  // A short pause lets the droplet settle on the picked item.
  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      window.setTimeout(() => menu.hidePopover(), still.matches ? 0 : 180);
    }
  });
}
