// Pure animation logic (no DOM). Run: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { deferred } from "../src/scripts/figma/core/deferred.ts";
import { curvePoint, lerpPoint, pointIn, union } from "../src/scripts/figma/core/geometry.ts";
import { isTypingNew, textAt } from "../src/scripts/figma/core/text.ts";
import { ease, scaled, SPEED } from "../src/scripts/figma/core/timing.ts";

const steps = (from: string, to: string, n: number): string[] => [
  ...new Set(Array.from({ length: n + 1 }, (_, i) => textAt(from, to, i / n))),
];

test("textAt backspaces the old text, then types the new", () => {
  assert.deepEqual(steps("A", "U", 20), ["A", "", "U"]);
  assert.deepEqual(steps("Resume", "GitHub", 60), [
    "Resume", "Resum", "Resu", "Res", "Re", "R", "", "G", "Gi", "Git", "GitH", "GitHu", "GitHub",
  ]);
});

test("textAt clamps progress outside 0..1", () => {
  assert.equal(textAt("A", "U", -1), "A");
  assert.equal(textAt("A", "U", 2), "U");
});

test("isTypingNew flips once the old text is gone", () => {
  assert.equal(isTypingNew("ab", "cd", 0.4), false);
  assert.equal(isTypingNew("ab", "cd", 0.6), true);
});

test("ease starts at 0, ends at 1 and is symmetric", () => {
  assert.equal(ease(0), 0);
  assert.equal(ease(1), 1);
  assert.equal(ease(0.5), 0.5);
  assert.ok(Math.abs(ease(0.25) + ease(0.75) - 1) < 1e-12);
});

test("scaled divides by SPEED", () => {
  assert.equal(scaled(SPEED * 100), 100);
});

test("curvePoint starts and ends on its endpoints and bows sideways", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  assert.deepEqual(curvePoint(a, b, 0.2, 0), a);
  assert.deepEqual(curvePoint(a, b, 0.2, 1), b);
  assert.ok(curvePoint(a, b, 0.2, 0.5).y > 0);
  assert.equal(curvePoint(a, b, 0, 0.5).y, 0);
});

test("geometry helpers", () => {
  assert.deepEqual(lerpPoint({ x: 0, y: 10 }, { x: 10, y: 20 }, 0.5), { x: 5, y: 15 });
  assert.deepEqual(union({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 5, w: 10, h: 10 }), { x: 0, y: 0, w: 30, h: 15 });
  assert.deepEqual(pointIn({ x: 10, y: 10, w: 20, h: 40 }, 0.5, 0.25), { x: 20, y: 20 });
});

test("deferred resolves when told", async () => {
  const d = deferred();
  let done = false;
  void d.promise.then(() => (done = true));
  await Promise.resolve();
  assert.equal(done, false);
  d.resolve();
  await d.promise;
  assert.equal(done, true);
});
