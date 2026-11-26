import assert from "node:assert/strict";
import { test } from "node:test";
import { coverSource, objectPosition } from "../src/backdrop.ts";

test("cover crops the long side and keeps the short side whole", () => {
  // A square photo in a tall box shows its full height and a centred strip of its width.
  assert.deepEqual(coverSource({ width: 640, height: 640 }, { width: 100, height: 200 }, 0.5, 0.5), { x: 160, y: 0, width: 320, height: 640 });
  // A wide box shows the full width; 25% puts the crop a quarter of the way down the spare height.
  assert.deepEqual(coverSource({ width: 640, height: 640 }, { width: 400, height: 200 }, 0.5, 0.25), { x: 0, y: 80, width: 640, height: 320 });
});

test("object-position reads percentages and centres anything else", () => {
  assert.deepEqual(objectPosition("50% 25%"), [0.5, 0.25]);
  assert.deepEqual(objectPosition("left 10px"), [0.5, 0.5]);
});
