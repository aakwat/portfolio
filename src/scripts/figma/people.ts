// Tone names map to .fb-tone-* classes in figma.css; colours never go inline (CSP).
export const PEOPLE = [
  { name: "Aung", tone: "blue" },
  { name: "Design", tone: "purple" },
  { name: "Dev", tone: "green" },
  { name: "QA", tone: "yellow" },
  { name: "Motion", tone: "pink" },
  { name: "Brand", tone: "teal" },
  { name: "Art", tone: "red" },
  { name: "Copy", tone: "coral" },
] as const;

export type Person = (typeof PEOPLE)[number];
export type Tone = Person["tone"];

export const NOTES = ["Nice", "Ship it", "Looks clean", "On it", "Tighter spacing"] as const;
