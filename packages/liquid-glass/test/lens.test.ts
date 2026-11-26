import assert from "node:assert/strict";
import { test } from "node:test";
import { lensPull } from "../src/lens.ts";

test("the rim pulls inward by at most the lens width; the flat top stays put", () => {
  const [, edge] = lensPull(0, 29.5, 200, 60, 30, 18);
  const [, centre] = lensPull(0, 0, 200, 60, 30, 18);
  assert.ok(edge < 0 && edge >= -18);
  assert.ok(Math.abs(centre) < 1e-3);
});
