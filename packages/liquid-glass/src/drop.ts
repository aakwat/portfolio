// Text links are shorter than a comfortable pill.
const MIN_HEIGHT = 36;

export interface Drop {
  place(item: HTMLElement | null): void;
}

// A glass droplet (a .glass-drop child of `container`) that follows the pointer, focus and a sliding finger across
// the items matching `items`. With `rest`, it stays visible after the pointer leaves.
export function attachDrop(container: HTMLElement, items: string, { rest = false } = {}): Drop {
  const set = (name: string, px: number) => container.style.setProperty(name, `${px}px`);
  const itemAt = (target: EventTarget | null): HTMLElement | null => {
    const item = target instanceof Element ? target.closest<HTMLElement>(items) : null;
    return item && container.contains(item) ? item : null;
  };
  const place = (item: HTMLElement | null) => {
    if (!item) return;
    // Appearing should not glide in from wherever it last was.
    if (container.dataset.dropOn === undefined) {
      container.dataset.dropSnap = "";
      requestAnimationFrame(() => requestAnimationFrame(() => delete container.dataset.dropSnap));
    }
    const height = Math.max(item.offsetHeight, MIN_HEIGHT);
    const width = item.offsetWidth + height - item.offsetHeight;
    set("--drop-x", item.offsetLeft - (width - item.offsetWidth) / 2);
    set("--drop-y", item.offsetTop - (height - item.offsetHeight) / 2);
    set("--drop-w", width);
    set("--drop-h", height);
    container.dataset.dropOn = "";
  };
  const hide = () => {
    delete container.dataset.dropPressed;
    if (!rest) delete container.dataset.dropOn;
  };

  // By position, not event target: a touch keeps targeting the item it started on while the finger slides.
  container.addEventListener("pointermove", (event) => place(itemAt(document.elementFromPoint(event.clientX, event.clientY))));
  container.addEventListener("pointerdown", (event) => {
    container.dataset.dropPressed = "";
    place(itemAt(event.target));
  });
  container.addEventListener("pointerup", () => delete container.dataset.dropPressed);
  container.addEventListener("pointercancel", hide);
  container.addEventListener("pointerleave", hide);
  container.addEventListener("focusin", (event) => place(itemAt(event.target)));
  container.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node && container.contains(event.relatedTarget))) hide();
  });
  return { place };
}
