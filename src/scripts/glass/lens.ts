// Refraction of live HTML: a pane's backdrop is bent by an SVG displacement filter (only Chromium applies SVG
// filters in backdrop-filter), driven by a lens map built here with the shader's lens shape. The map reaches the
// filter as a blob: URL, which the CSP's img-src allows (assets/_headers).

// How far in from the edge the lens curves, as a share of the pane's shorter half; shared with the WebGPU glass.
export const LENS_REACH = 0.6;

// Inigo Quilez's rounded box, as in shader.ts: negative inside, positive outside.
function edgeDistance(x: number, y: number, halfW: number, halfH: number, radius: number): number {
  const qx = Math.abs(x) - halfW + radius;
  const qy = Math.abs(y) - halfH + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

// Inward shift in CSS px for the point (x, y) from the pane's centre: the whole lens width at the edge, none on the
// flat top, with the shader's flat-topped profile in between.
export function lensPull(x: number, y: number, width: number, height: number, radius: number, lens: number): [number, number] {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const d = edgeDistance(x, y, halfW, halfH, r);
  if (d >= 0) return [0, 0];
  const bend = Math.pow(Math.min(-d / lens, 1), 0.25) * 1.57;
  const pull = lens * (1 - Math.sin(bend));
  const gx = edgeDistance(x + 0.5, y, halfW, halfH, r) - edgeDistance(x - 0.5, y, halfW, halfH, r);
  const gy = edgeDistance(x, y + 0.5, halfW, halfH, r) - edgeDistance(x, y - 0.5, halfW, halfH, r);
  const length = Math.hypot(gx, gy) || 1;
  return [(-gx / length) * pull, (-gy / length) * pull];
}

// RGBA bytes for feDisplacementMap: red shifts x, green shifts y, 127.5 is no shift, and 0..255 spans ±lens,
// so the filter's scale is 2 × lens.
export function lensMap(width: number, height: number, radius: number, lens: number): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const [dx, dy] = lensPull(col + 0.5 - width / 2, row + 0.5 - height / 2, width, height, radius, lens);
      const i = (row * width + col) * 4;
      data[i] = 127.5 + (dx / (2 * lens)) * 255;
      data[i + 1] = 127.5 + (dy / (2 * lens)) * 255;
      data[i + 3] = 255;
    }
  }
  return data;
}

async function paintLens(pane: HTMLElement): Promise<void> {
  const filter = document.getElementById(pane.dataset.glassLens ?? "");
  const image = filter?.querySelector("feImage");
  const shift = filter?.querySelector("feDisplacementMap");
  const rect = pane.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (!image || !shift || width === 0 || height === 0) {
    delete pane.dataset.lensLive;
    return;
  }
  const lens = (LENS_REACH * Math.min(width, height)) / 2;
  const radius = Number.parseFloat(getComputedStyle(pane).borderTopLeftRadius);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(new ImageData(lensMap(width, height, radius, lens), width, height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
  if (!blob) return;
  const previous = image.getAttribute("href");
  image.setAttribute("href", URL.createObjectURL(blob));
  image.setAttribute("width", String(width));
  image.setAttribute("height", String(height));
  shift.setAttribute("scale", String(2 * lens));
  if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
  pane.dataset.lensLive = "";
}

// Panes name their filter's id in data-glass-lens and get data-lens-live once its map is in place.
export function startLens(): void {
  // userAgentData exists only in Chromium, the one engine that applies url() in backdrop-filter.
  if (!("userAgentData" in navigator) || matchMedia("(prefers-reduced-transparency: reduce)").matches) return;
  const panes = document.querySelectorAll<HTMLElement>("[data-glass-lens]");
  // Fires once on observe, which paints the first map; the map must match the pane's size, so resizes repaint.
  const resized = new ResizeObserver((entries) => {
    for (const entry of entries) if (entry.target instanceof HTMLElement) void paintLens(entry.target);
  });
  panes.forEach((pane) => resized.observe(pane));
}
