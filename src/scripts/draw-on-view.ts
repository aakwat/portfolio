// Drawings marked data-draw start hidden and draw once when scrolled into view; reduced motion keeps them still.
const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!still) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof SVGElement)) continue;
        entry.target.dataset.draw = "go";
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.4 },
  );
  for (const el of document.querySelectorAll<SVGElement>("[data-draw]")) {
    el.dataset.draw = "ready";
    observer.observe(el);
  }
}

export {};
