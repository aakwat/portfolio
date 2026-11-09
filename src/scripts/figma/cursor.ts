import { layer, rectOf } from "./layer";
import type { Person } from "./people";
import { sleep, tween } from "./time";

const SVG = "http://www.w3.org/2000/svg";
const ARROW = "M1.5 1.2 L1.5 16.6 L5.6 12.7 L8.6 18.9 L11.3 17.7 L8.4 11.6 L14.2 11.4 Z";

function arrow(): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 18 20");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", ARROW);
  svg.append(path);
  return svg;
}

export class Cursor {
  readonly person: Person;
  private readonly el: HTMLElement;
  private readonly chatEl: HTMLElement;
  private x: number;
  private y: number;

  constructor(person: Person, x: number, y: number) {
    this.person = person;
    this.el = document.createElement("div");
    this.el.className = `fb-cursor fb-tone-${person.tone}`;
    const tag = document.createElement("span");
    tag.className = "fb-tag";
    tag.textContent = person.name;
    this.chatEl = document.createElement("span");
    this.chatEl.className = "fb-chat";
    this.el.append(arrow(), tag, this.chatEl);
    layer().append(this.el);
    this.x = x;
    this.y = y;
    this.set(x, y);
  }

  private set(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.el.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Curved path, duration scaled to distance, like a hand on a trackpad.
  to(x: number, y: number, ms?: number): Promise<void> {
    const x0 = this.x;
    const y0 = this.y;
    const dx = x - x0;
    const dy = y - y0;
    const bend = (Math.random() - 0.5) * 0.35;
    const cx = x0 + dx / 2 - dy * bend;
    const cy = y0 + dy / 2 + dx * bend;
    return tween(ms ?? 380 + Math.hypot(dx, dy) * 0.9, (e) => {
      const u = 1 - e;
      this.set(u * u * x0 + 2 * u * e * cx + e * e * x, u * u * y0 + 2 * u * e * cy + e * e * y);
    });
  }

  toEl(target: Element, fx = 0.5, fy = 0.5): Promise<void> {
    const r = rectOf(target);
    return this.to(r.x + r.w * fx, r.y + r.h * fy);
  }

  async click(): Promise<void> {
    this.el.classList.add("fb-down");
    await sleep(110);
    this.el.classList.remove("fb-down");
    await sleep(90);
  }

  async chat(text: string, ms = 1200): Promise<void> {
    this.chatEl.textContent = text;
    this.el.classList.add("fb-chatting");
    await sleep(ms);
    this.el.classList.remove("fb-chatting");
  }

  async idle(ms: number): Promise<void> {
    const end = performance.now() + ms;
    const x = this.x;
    const y = this.y;
    while (performance.now() < end) {
      await this.to(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 10, 300);
    }
  }

  async leave(): Promise<void> {
    this.el.classList.add("fb-leaving");
    await this.to(this.x + (Math.random() - 0.5) * 120, this.y + 80, 500);
    this.el.remove();
  }
}
