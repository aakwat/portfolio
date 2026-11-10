export function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function chance(p: number): boolean {
  return Math.random() < p;
}

export function pick<T>(list: readonly T[]): T {
  const item = list[Math.floor(Math.random() * list.length)];
  if (item === undefined) throw new Error("pick from an empty list");
  return item;
}
