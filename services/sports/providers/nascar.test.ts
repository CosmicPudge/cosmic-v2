import assert from "node:assert/strict";
import test from "node:test";
import { resolveNascarRaceState } from "./nascar";

const start = new Date("2026-10-04T18:00:00Z");

test("NASCAR races are scheduled before the start", () => {
  assert.equal(resolveNascarRaceState({ scheduled_laps: 267 }, new Date("2026-10-04T17:59:59Z"), start).state, "scheduled");
});

test("NASCAR actual laps make the race authoritative live", () => {
  const result = resolveNascarRaceState({ actual_laps: 12, scheduled_laps: 267 }, new Date("2026-10-04T19:00:00Z"), start);
  assert.equal(result.state, "live");
  assert.equal(result.inferredLive, false);
  assert.equal(result.statusSource, "provider");
});

test("NASCAR missing live fields use a bounded inferred window", () => {
  const result = resolveNascarRaceState({ scheduled_laps: 267 }, new Date("2026-10-04T19:00:00Z"), start);
  assert.equal(result.state, "live");
  assert.equal(result.inferredLive, true);
  assert.equal(resolveNascarRaceState({ scheduled_laps: 267 }, new Date("2026-10-05T01:00:01Z"), start).state, "unknown");
});

test("NASCAR completion wins immediately", () => {
  assert.equal(resolveNascarRaceState({ actual_laps: 267, scheduled_laps: 267 }, new Date("2026-10-04T20:00:00Z"), start).state, "complete");
});
