import assert from "node:assert/strict";
import test from "node:test";
import { runFootballSoakSimulation } from "./soakSimulation";

test("long-game football simulation keeps history and event state bounded", () => {
  const result = runFootballSoakSimulation(180);
  assert.equal(result.updates, 180);
  assert.equal(result.scoreChanges, 7);
  assert.equal(result.maxRecentPlays, 8);
  assert.equal(result.maxRecentDrives, 6);
  assert.equal(result.eventId, "soak-event");
});
