import assert from "node:assert/strict";
import test from "node:test";

import type { SportsEvent } from "@/core/contracts/Sports";
import { checkpointState } from "./checkpointState";
import { checkpointId } from "./checkpointIdentity";

const event = (overrides: Partial<SportsEvent> = {}): SportsEvent => ({ id: "401", sport: "college-football", title: "Utah vs BYU", start: new Date("2026-09-06T19:00:00.000Z"), status: "live", source: "espn", provider: "espn", homeTeam: { id: "254", name: "Utah", score: 21 }, awayTeam: { id: "252", name: "BYU", score: 14 }, metadata: { period: 4, clock: "07:00", sessionKind: "race", driverId: "driver-1", finishingPosition: 2 }, ...overrides });

test("checkpoint state stores only normalized transition fields", () => {
  const state = checkpointState(event());
  assert.deepEqual(state, { status: "live", startTime: "2026-09-06T19:00:00.000Z", homeScore: 21, awayScore: 14, period: 4, clock: "07:00", sessionKind: "race", driverId: "driver-1", finishingPosition: 2 });
  assert.equal(JSON.stringify(state).includes("Utah vs BYU"), false);
});

test("checkpoint identity namespaces provider, sport, and event", () => {
  assert.equal(checkpointId({ provider: "espn", sport: "nfl", eventId: "401" }), "espn:nfl:401");
  assert.notEqual(checkpointId({ provider: "espn", sport: "nfl", eventId: "401" }), checkpointId({ provider: "espn", sport: "college-football", eventId: "401" }));
});
