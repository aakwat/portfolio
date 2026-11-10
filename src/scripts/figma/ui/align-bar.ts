import type { Rect } from "../core/geometry";
import { el, layer } from "../dom/overlay";

export type AlignAction = "left" | "hcenter" | "vcenter" | "distribute";

const ICONS: ReadonlyArray<[AlignAction, number]> = [
  ["left", 2],
  ["hcenter", 2],
  ["vcenter", 2],
  ["distribute", 3],
];

// Figma's floating align bar; icons are drawn in CSS from plain bars.
export function alignBar(): {
  icon(action: AlignAction): HTMLElement;
  pressed(action: AlignAction, on: boolean): void;
  placeAround(selection: Rect): void;
  remove(): void;
} {
  const bar = el("fb-align");
  const icons = new Map<AlignAction, HTMLElement>();
  for (const [action, bars] of ICONS) {
    const ico = el(`fb-ico fb-ico-${action}`);
    for (let i = 0; i < bars; i++) ico.append(document.createElement("i"));
    bar.append(ico);
    icons.set(action, ico);
  }
  layer().append(bar);
  const icon = (action: AlignAction): HTMLElement => {
    const ico = icons.get(action);
    if (!ico) throw new Error(`no align icon ${action}`);
    return ico;
  };
  return {
    icon,
    pressed: (action, on) => icon(action).classList.toggle("fb-on", on),
    placeAround: (s) => {
      bar.style.left = `${s.x}px`;
      // Above the selection like Figma, or below it when the layer is too close to the top.
      bar.style.top = `${s.y >= 52 ? s.y - 44 : s.y + s.h + 14}px`;
    },
    remove: () => bar.remove(),
  };
}
