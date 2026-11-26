// Picking a link in the phone menu closes it; Esc and outside taps are handled by the popover itself.
// A glass droplet (Nav.astro) follows the pointer, focus and a sliding finger across the links.
const menu = document.getElementById("nav-menu");
const still = window.matchMedia("(prefers-reduced-motion: reduce)");

function itemAt(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>("#nav-menu a") : null;
}

if (menu) {
  const place = (item: HTMLElement | null) => {
    if (item) menu.style.setProperty("--drop-y", `${item.offsetTop}px`);
  };
  const release = () => delete menu.dataset.pressed;

  // By position, not event target: a touch keeps targeting the item it started on while the finger slides.
  menu.addEventListener("pointermove", (event) => place(itemAt(document.elementFromPoint(event.clientX, event.clientY))));
  menu.addEventListener("pointerdown", (event) => {
    menu.dataset.pressed = "";
    place(itemAt(event.target));
  });
  menu.addEventListener("pointerup", release);
  menu.addEventListener("pointercancel", release);
  menu.addEventListener("pointerleave", release);
  menu.addEventListener("focusin", (event) => place(itemAt(event.target)));

  // Opens with the droplet resting on the first item, without gliding there from wherever it last was.
  menu.addEventListener("toggle", (event) => {
    if (!(event instanceof ToggleEvent) || event.newState !== "open") return;
    menu.dataset.snap = "";
    place(menu.querySelector<HTMLElement>("a"));
    requestAnimationFrame(() => requestAnimationFrame(() => delete menu.dataset.snap));
  });

  // A short pause before closing lets the droplet settle on the picked item.
  menu.addEventListener("click", (event) => {
    if (itemAt(event.target)) window.setTimeout(() => menu.hidePopover(), still.matches ? 0 : 180);
  });
}

export {};
