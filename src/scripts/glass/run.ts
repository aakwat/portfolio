// Turns each [data-glass] pane into WebGPU liquid glass over the image its value names (an element id).
// Without WebGPU, or for visitors who asked for less transparency, panes keep their CSS look.
import { composeBackdrop } from "./backdrop";
import { drawGlass, startGPU, type GlassGPU } from "./render";

const panes = [...document.querySelectorAll<HTMLElement>("[data-glass]")];

function drawPane(gpu: GlassGPU, pane: HTMLElement): void {
  const canvas = pane.querySelector<HTMLCanvasElement>(":scope > canvas.glass-canvas");
  const photo = document.getElementById(pane.dataset.glass ?? "");
  const media = pane.dataset.glassMedia;
  const rect = pane.getBoundingClientRect();
  const off = () => {
    delete pane.dataset.glassLive;
  };
  if (!canvas || !(photo instanceof HTMLImageElement) || rect.width === 0 || (media && !matchMedia(media).matches)) {
    off();
    return;
  }
  if (!photo.complete || photo.naturalWidth === 0) {
    photo.addEventListener("load", () => drawPane(gpu, pane), { once: true });
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const backdrop = composeBackdrop(rect, photo, dpr);
  const radius = Number.parseFloat(getComputedStyle(pane).borderTopLeftRadius) * dpr;
  if (backdrop && drawGlass(gpu, canvas, backdrop, radius, dpr)) pane.dataset.glassLive = "";
  else off();
}

async function start(): Promise<void> {
  if (panes.length === 0 || matchMedia("(prefers-reduced-transparency: reduce)").matches) return;
  const gpu = await startGPU().catch(() => null);
  if (!gpu) return;
  void gpu.device.lost.then(() => panes.forEach((pane) => delete pane.dataset.glassLive));

  let queued = false;
  const redraw = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      panes.forEach((pane) => drawPane(gpu, pane));
    });
  };
  // Fires once on observe, which is the first draw.
  const resized = new ResizeObserver(redraw);
  panes.forEach((pane) => resized.observe(pane));
  // The backdrop repaints the page colour, so a theme switch needs a redraw.
  new MutationObserver(redraw).observe(document.documentElement, { attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);
}

void start();
