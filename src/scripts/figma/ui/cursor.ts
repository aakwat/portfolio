import { curvePoint, pointIn, type Point } from "../core/geometry";
import type { Person } from "../core/people";
import { between } from "../core/random";
import { scaled } from "../core/timing";
import { sleep, tween } from "../dom/clock";
import { el, layer, rectOf } from "../dom/overlay";

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

// A collaborator's pointer: arrow, name tag and chat bubble in their tone.
export class Cursor {
  readonly person: Person;
  private readonly node: HTMLElement;
  private readonly bubble: HTMLElement;
  private pos: Point;

  constructor(person: Person, start: Point) {
    this.person = person;
    this.node = el(`fb-cursor fb-tone-${person.tone}`);
    this.bubble = el("fb-chat", "", "span");
    this.node.append(arrow(), el("fb-tag", person.name, "span"), this.bubble);
    layer().append(this.node);
    this.pos = start;
    this.at(start);
  }

  get position(): Point {
    return this.pos;
  }

  // Jumps without easing; actions call it every frame while the cursor drags something.
  at(p: Point): void {
    this.pos = p;
    this.node.style.transform = `translate(${p.x}px, ${p.y}px)`;
  }

  // Curved path; the duration grows with distance unless given.
  to(target: Point, ms?: number): Promise<void> {
    const from = this.pos;
    const bend = between(-0.175, 0.175);
    const duration = ms ?? 380 + Math.hypot(target.x - from.x, target.y - from.y) * 0.9;
    return tween(duration, (e) => this.at(curvePoint(from, target, bend, e)));
  }

  toEl(target: Element, fx = 0.5, fy = 0.5, ms?: number): Promise<void> {
    return this.to(pointIn(rectOf(target), fx, fy), ms);
  }

  async click(): Promise<void> {
    this.hold(true);
    await sleep(110);
    this.hold(false);
    await sleep(90);
  }

  // Pressed look while dragging.
  hold(pressed: boolean): void {
    this.node.classList.toggle("fb-down", pressed);
  }

  async chat(text: string, ms = 1200): Promise<void> {
    this.bubble.textContent = text;
    this.node.classList.add("fb-chatting");
    await sleep(ms);
    this.node.classList.remove("fb-chatting");
  }

  // Small restless moves on the spot, like a hand resting on the trackpad.
  async idle(ms: number): Promise<void> {
    const end = performance.now() + scaled(ms);
    const home = this.pos;
    while (performance.now() < end) {
      await this.to({ x: home.x + between(-7, 7), y: home.y + between(-5, 5) }, 300);
    }
  }

  async leave(): Promise<void> {
    this.node.classList.add("fb-leaving");
    await this.to({ x: this.pos.x + between(-60, 60), y: this.pos.y + 80 }, 500);
    this.node.remove();
  }
}
