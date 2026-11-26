// The GPU reads only images, so what CSS shows behind a pane is repainted into a canvas.

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

// posX, posY: object-position as fractions (0.5 = centred).
export function coverSource(natural: Size, box: Size, posX: number, posY: number): Rect {
  const scale = Math.max(box.width / natural.width, box.height / natural.height);
  const width = box.width / scale;
  const height = box.height / scale;
  return { x: (natural.width - width) * posX, y: (natural.height - height) * posY, width, height };
}

// Keywords and lengths fall back to centred.
export function objectPosition(value: string): [number, number] {
  const [x = "", y = ""] = value.split(" ");
  const fraction = (part: string) => (part.endsWith("%") ? Number.parseFloat(part) / 100 : 0.5);
  return [fraction(x), fraction(y)];
}

// First stop of a top-to-bottom fade, e.g. linear-gradient(#000 70%, transparent).
export function fadeFrom(maskImage: string): number {
  const percent = /(\d+(?:\.\d+)?)%/.exec(maskImage)?.[1];
  return percent === undefined ? 0 : Number.parseFloat(percent) / 100;
}

function photoLayer(photo: HTMLImageElement, box: DOMRect, dpr: number): HTMLCanvasElement | null {
  const layer = document.createElement("canvas");
  layer.width = Math.max(1, Math.round(box.width * dpr));
  layer.height = Math.max(1, Math.round(box.height * dpr));
  const ctx = layer.getContext("2d");
  if (!ctx) return null;
  const style = getComputedStyle(photo);
  const [posX, posY] = objectPosition(style.objectPosition);
  const src = coverSource({ width: photo.naturalWidth, height: photo.naturalHeight }, box, posX, posY);
  ctx.filter = style.filter;
  ctx.drawImage(photo, src.x, src.y, src.width, src.height, 0, 0, layer.width, layer.height);
  // ponytail: top-to-bottom fades only; parse the full gradient if other masks appear.
  if (style.maskImage && style.maskImage !== "none") {
    ctx.filter = "none";
    ctx.globalCompositeOperation = "destination-in";
    const fade = ctx.createLinearGradient(0, 0, 0, layer.height);
    fade.addColorStop(fadeFrom(style.maskImage), "#000");
    fade.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, layer.width, layer.height);
  }
  return layer;
}

export function composeBackdrop(pane: DOMRect, photo: HTMLImageElement, dpr: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(pane.width * dpr));
  canvas.height = Math.max(1, Math.round(pane.height * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(canvas.width / pane.width, canvas.height / pane.height);
  ctx.translate(-pane.x, -pane.y);
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
  ctx.fillRect(pane.x, pane.y, pane.width, pane.height);
  const box = photo.getBoundingClientRect();
  const layer = photoLayer(photo, box, dpr);
  if (!layer) return null;
  ctx.drawImage(layer, box.x, box.y, box.width, box.height);
  return canvas;
}
