// Picking a link in the phone menu closes it; Esc and outside taps are handled by the popover itself.
const menu = document.getElementById("nav-menu");

menu?.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("a")) menu.hidePopover();
});

export {};
