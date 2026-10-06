import test from "node:test";
import assert from "node:assert/strict";
import { batchKey, canAdvanceStage, canonicalPhone, formatPhoneInput, hasCapacity, isCutoffOpen } from "./domain.ts";

test("formats phone input while preserving normal editing", () => {
  assert.equal(formatPhoneInput("1234567890"), "(123)456-7890");
  assert.equal(formatPhoneInput("+1 (123) 456-7890"), "(123)456-7890");
  assert.equal(canonicalPhone("(123)456-7890"), "+11234567890");
  assert.equal(canonicalPhone("123"), null);
});

test("cutoff is Thursday at 3 p.m. in Denver", () => {
  assert.equal(isCutoffOpen("2026-07-18", new Date("2026-07-16T20:59:00Z")), true);
  assert.equal(isCutoffOpen("2026-07-18", new Date("2026-07-16T21:00:00Z")), false);
});

test("capacity and dated batch isolation are explicit", () => {
  assert.equal(hasCapacity(10, 5, 15), true); assert.equal(hasCapacity(10, 6, 15), false);
  assert.notEqual(batchKey("2026-07-18", "morning"), batchKey("2026-07-19", "morning"));
});

test("production transitions advance exactly one stage", () => {
  assert.equal(canAdvanceStage("Accepted", "Preparing ingredients"), true);
  assert.equal(canAdvanceStage("Accepted", "Frying"), false);
});
