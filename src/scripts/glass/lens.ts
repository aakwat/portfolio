// Refraction of live HTML: a pane's backdrop is bent by an SVG displacement filter (only Chromium applies SVG
// filters in backdrop-filter), driven by a lens map built here with the shader's lens shape. The map reaches the
// filter as a blob: URL, which the CSP's img-src allows (assets/_headers).
// Each pane is tuned in CSS with --glass-bend (rim pull, px) and --glass-blur (softness, px); see global.css.

// How far in from the edge the WebGPU lens curves, as a share of the pane's shorter half.
export const LENS_REACH = 0.6;

// Inigo Quilez's rounded box, as in shader.ts: negative inside, positive outside.
function edgeDistance(x: number, y: number, halfW: number, halfH: number, radius: number): number {
  const qx = Math.abs(x) - halfW + radius;
  const qy = Math.abs(y) - halfH + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

// Inward shift in CSS px for the point (x, y) from the pane's centre: the whole lens width at the edge, none on the
// flat top. flatTop is the shader's profile power: lower keeps the top flatter and the bend tighter to the rim.
export function lensPull(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  lens: number,
  flatTop = 0.25,
): [number, number] {
  const halfW = width / 2;
  const halfH = height / 2;
  const r = Math.min(radius, halfW, halfH);
  const d = edgeDistance(x, y, halfW, halfH, r);
  if (d >= 0) return [0, 0];
  const bend = Math.pow(Math.min(-d / lens, 1), flatTop) * 1.57;
  const pull = lens * (1 - Math.sin(bend));
  const gx = edgeDistance(x + 0.5, y, halfW, halfH, r) - edgeDistance(x - 0.5, y, halfW, halfH, r);
  const gy = edgeDistance(x, y + 0.5, halfW, halfH, r) - edgeDistance(x, y - 0.5, halfW, halfH, r);
  const length = Math.hypot(gx, gy) || 1;
  return [(-gx / length) * pull, (-gy / length) * pull];
}

// SVG lenses use a softer profile than the hero shader: the bend spreads over a wider, visibly rounded edge.
const SVG_FLAT_TOP = 0.5;

// RGBA bytes for feDisplacementMap: red shifts x, green shifts y, 127.5 is no shift, and 0..255 spans ±lens,
// so the filter's scale is 2 × lens.
export function lensMap(width: number, height: number, radius: number, lens: number): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const [dx, dy] = lensPull(col + 0.5 - width / 2, row + 0.5 - height / 2, width, height, radius, lens, SVG_FLAT_TOP);
      const i = (row * width + col) * 4;
      data[i] = 127.5 + (dx / (2 * lens)) * 255;
      data[i + 1] = 127.5 + (dy / (2 * lens)) * 255;
      data[i + 3] = 255;
    }
  }
  return data;
}

interface Lens {
  image: SVGElement;
  shift: SVGElement;
  soft: SVGElement;
}

const SVG = "http://www.w3.org/2000/svg";
const lenses = new WeakMap<HTMLElement, Lens>();

function svg(tag: string, attributes: Record<string, string>): SVGElement {
  const element = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

// One filter per pane, in a shared zero-size <svg>; sRGB, so the map's bytes are read as-is.
function lensFor(pane: HTMLElement, defs: SVGElement): Lens {
  const known = lenses.get(pane);
  if (known) return known;
  const id = `glass-lens-${defs.childElementCount}`;
  const filter = svg("filter", { id, x: "0", y: "0", width: "100%", height: "100%", "color-interpolation-filters": "sRGB" });
  const image = svg("feImage", { result: "map", preserveAspectRatio: "none" });
  const shift = svg("feDisplacementMap", { in: "SourceGraphic", in2: "map", xChannelSelector: "R", yChannelSelector: "G", result: "bent" });
  const soft = svg("feGaussianBlur", { in: "bent", result: "soft" });
  filter.append(image, shift, soft, svg("feColorMatrix", { in: "soft", type: "saturate", values: "1.6" }));
  defs.append(filter);
  pane.style.setProperty("--glass-lens", `url(#${id})`);
  const lens = { image, shift, soft };
  lenses.set(pane, lens);
  return lens;
}

async function paintLens(pane: HTMLElement, defs: SVGElement): Promise<void> {
  const rect = pane.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width === 0 || height === 0) {
    delete pane.dataset.lensLive;
    return;
  }
  const style = getComputedStyle(pane);
  const lens = Math.min(Number.parseFloat(style.getPropertyValue("--glass-bend")) || 0, width / 2, height / 2);
  if (lens <= 0) return;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(new ImageData(lensMap(width, height, Number.parseFloat(style.borderTopLeftRadius), lens), width, height), 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
  if (!blob) return;
  const { image, shift, soft } = lensFor(pane, defs);
  const previous = image.getAttribute("href");
  image.setAttribute("href", URL.createObjectURL(blob));
  image.setAttribute("width", String(width));
  image.setAttribute("height", String(height));
  shift.setAttribute("scale", String(2 * lens));
  soft.setAttribute("stdDeviation", String(Number.parseFloat(style.getPropertyValue("--glass-blur")) || 0));
  if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
  pane.dataset.lensLive = "";
}

// Panes with an empty data-glass bend the live page; they get data-lens-live once their filter is ready.
export function startLens(): void {
  // userAgentData exists only in Chromium, the one engine that applies url() in backdrop-filter.
  if (!("userAgentData" in navigator) || matchMedia("(prefers-reduced-transparency: reduce)").matches) return;
  const panes = document.querySelectorAll<HTMLElement>('[data-glass=""]');
  if (panes.length === 0) return;
  const defs = svg("svg", { class: "lens-defs", "aria-hidden": "true" });
  document.body.append(defs);
  // Fires once on observe, which paints the first map; the map must match the pane's size, so resizes repaint.
  const resized = new ResizeObserver((entries) => {
    for (const entry of entries) if (entry.target instanceof HTMLElement) void paintLens(entry.target, defs);
  });
  panes.forEach((pane) => resized.observe(pane));
}
