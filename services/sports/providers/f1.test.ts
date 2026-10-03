import assert from "node:assert/strict";
import test from "node:test";
import { f1SessionKey, parseF1SessionStart, resolveF1SessionState, resolveF1Timezone } from "./f1";

test("F1 practice sessions receive unique keys", () => {
  assert.deepEqual([f1SessionKey("Practice 1"), f1SessionKey("Practice 2"), f1SessionKey("Practice 3")], ["practice1", "practice2", "practice3"]);
});

test("Sepang local time converts from MYT to UTC without browser/server timezone dependence", () => {
  assert.equal(parseF1SessionStart("2026-10-03", "12:30:00", "Malaysia").toISOString(), "2026-10-03T04:30:00.000Z");
  assert.equal(parseF1SessionStart("2026-10-03", "04:30:00Z", "Malaysia").toISOString(), "2026-10-03T04:30:00.000Z");
});

test("F1 circuit timezone aliases resolve without relying on the host timezone", () => {
  assert.equal(resolveF1Timezone("Suzuka Circuit", "Japan"), "Asia/Tokyo");
  assert.equal(resolveF1Timezone("Circuit of the Americas", "United States"), "America/Chicago");
  assert.equal(resolveF1Timezone("Las Vegas Strip Circuit", "United States"), "America/Los_Angeles");
  assert.equal(resolveF1Timezone("Unknown Circuit", "Unknown"), undefined);
});

test("F1 sessions transition from scheduled to inferred live to complete", () => {
  const start = new Date("2026-10-03T04:30:00Z");
  assert.equal(resolveF1SessionState({ start, now: new Date("2026-10-03T04:29:59Z"), kind: "practice" }).state, "scheduled");
  const live = resolveF1SessionState({ start, now: new Date("2026-10-03T05:09:00Z"), kind: "practice" });
  assert.equal(live.state, "live");
  assert.equal(live.status, "live");
  assert.equal(live.inferredLive, true);
  assert.equal(resolveF1SessionState({ start, now: new Date("2026-10-03T06:01:00Z"), kind: "practice" }).state, "complete");
});

test("authoritative F1 status overrides inferred state", () => {
  const start = new Date("2026-10-03T04:30:00Z");
  assert.equal(resolveF1SessionState({ start, now: new Date("2026-10-03T05:00:00Z"), kind: "practice", providerStatus: "final" }).state, "complete");
  assert.equal(resolveF1SessionState({ start, now: new Date("2026-10-03T06:30:00Z"), kind: "practice", providerStatus: "live" }).state, "live");
});
