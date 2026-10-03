import assert from "node:assert/strict";
import test from "node:test";
import { f1SessionKey, parseF1SessionStart } from "./f1";

test("F1 practice sessions receive unique keys", () => {
  assert.deepEqual([f1SessionKey("Practice 1"), f1SessionKey("Practice 2"), f1SessionKey("Practice 3")], ["practice1", "practice2", "practice3"]);
});

test("Sepang local time converts from MYT to UTC without browser/server timezone dependence", () => {
  assert.equal(parseF1SessionStart("2026-10-03", "12:30:00", "Malaysia").toISOString(), "2026-10-03T04:30:00.000Z");
  assert.equal(parseF1SessionStart("2026-10-03", "04:30:00Z", "Malaysia").toISOString(), "2026-10-03T04:30:00.000Z");
});
