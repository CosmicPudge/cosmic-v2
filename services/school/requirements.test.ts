import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { resolveRequirementDate, requirementCategory } from "./requirements.ts";

test("resolves an explicit weekday from source context", () => {
  const result = resolveRequirementDate({ relevantWeekday: "Wednesday" }, new Date("2026-09-07T12:00:00Z"));
  assert.equal(result?.toISOString().slice(0, 10), "2026-09-09");
});
test("does not fabricate an unresolved date", () => {
  assert.equal(resolveRequirementDate({}, new Date("2026-09-07T12:00:00Z")), undefined);
  assert.equal(requirementCategory("wear"), "wear");
});
