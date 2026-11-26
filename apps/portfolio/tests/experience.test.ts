import assert from "node:assert/strict";
import { test } from "node:test";
import { roles, shortDate } from "../src/lib/experience.ts";

test("shortDate shows month and year", () => {
  assert.equal(shortDate("2024-04"), "Apr 2024");
  assert.equal(shortDate("2022-12"), "Dec 2022");
});

test("roles run newest first, and only the first is current", () => {
  for (const [i, role] of roles.entries()) {
    const next = roles[i + 1];
    if (next) assert.ok(role.from > next.from, `${role.org} should start after ${next.org}`);
    assert.equal(role.to === null, i === 0);
    if (role.to) assert.ok(role.to >= role.from);
  }
});
