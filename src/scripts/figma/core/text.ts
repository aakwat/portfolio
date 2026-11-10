// Text at progress p (0..1) of a rename: backspace `from` letter by letter, then type `to`.
export function textAt(from: string, to: string, p: number): string {
  const total = from.length + to.length;
  const step = Math.round(Math.min(1, Math.max(0, p)) * total);
  return step <= from.length ? from.slice(0, from.length - step) : to.slice(0, step - from.length);
}

// True once the old text is fully erased and the new text has started.
export function isTypingNew(from: string, to: string, p: number): boolean {
  return p * (from.length + to.length) > from.length;
}
