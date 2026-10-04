import assert from "node:assert/strict";
import test from "node:test";
import { diffFootballState, hasFootballStateChange } from "./stateDiff";

const base = { sport: "nfl" as const, eventId: "event", generatedAt: "now", stale: false, sources: [], away: { team: { id: "away", name: "Away" }, score: 0 }, home: { team: { id: "home", name: "Home" }, score: 0 }, situation: {} };

test("detects bounded field-level changes", () => {
  const delta = diffFootballState(base, { ...base, home: { ...base.home, score: 7 }, clock: "09:58", situation: { possessionTeamId: "home", downDistanceText: "1st & 10" } });
  assert.equal(delta.scoreChanged, true);
  assert.equal(delta.clockChanged, true);
  assert.equal(delta.possessionChanged, true);
  assert.equal(delta.situationChanged, true);
  assert.equal(hasFootballStateChange(delta), true);
});

test("unchanged normalized responses do not produce a delta", () => {
  const delta = diffFootballState(base, { ...base });
  assert.equal(hasFootballStateChange(delta), false);
});

test("event state can reset cleanly without treating a zero score as missing", () => {
  const delta = diffFootballState({ ...base, eventId: "old", home: { ...base.home, score: 14 } }, { ...base, eventId: "new" });
  assert.equal(delta.scoreChanged, true);
  assert.equal(delta.lifecycleChanged, false);
});
