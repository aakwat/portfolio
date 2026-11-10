// Project videos play only while on screen, and never for visitors who asked for reduced motion.
const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]")];
const still = window.matchMedia("(prefers-reduced-motion: reduce)");

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (!(video instanceof HTMLVideoElement)) continue;
      if (entry.isIntersecting && !still.matches) {
        video.play().catch(() => {
          // Autoplay can still be refused (e.g. data saver); the poster stays, which is fine.
        });
      } else {
        video.pause();
      }
    }
  },
  { threshold: 0.4 },
);

for (const video of videos) observer.observe(video);
