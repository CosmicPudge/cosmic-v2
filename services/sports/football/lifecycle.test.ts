import assert from "node:assert/strict";
import test from "node:test";
import type { SportsEvent } from "@/core/contracts/Sports";
import { FOOTBALL_FINAL_HOLD_MS, FOOTBALL_PREGAME_WINDOW_MS, footballCountdownLabel, resolveFootballLifecycle } from "./lifecycle";

const now = new Date("2026-10-03T23:00:00Z");
function event(status: SportsEvent["status"] = "scheduled", start = new Date(now.getTime() + 20 * 60_000), extra: Partial<SportsEvent> = {}): SportsEvent {
  return { id: "football-test", sport: "college-football", title: "Utah State at Boise State", start, status, source: "test", ...extra };
}

test("pregame begins inside the 30-minute window", () => {
  assert.equal(resolveFootballLifecycle(event("scheduled", new Date(now.getTime() + FOOTBALL_PREGAME_WINDOW_MS)), undefined, now), "pregame");
  assert.equal(resolveFootballLifecycle(event("scheduled", new Date(now.getTime() + FOOTBALL_PREGAME_WINDOW_MS + 1)), undefined, now), "upcoming");
});

test("countdown never becomes negative", () => {
  assert.equal(footballCountdownLabel(event("scheduled", new Date(now.getTime() - 5_000)), now), "KICKOFF IN 0 SEC");
  assert.equal(footballCountdownLabel(event("scheduled", new Date(now.getTime() + 4 * 60_000)), now), "KICKOFF IN 4 MIN");
});

test("starting, live, halftime, overtime, delayed, suspended, and final are provider-confirmed", () => {
  assert.equal(resolveFootballLifecycle(event("scheduled", new Date(now.getTime() - 5 * 60_000)), undefined, now), "starting");
  assert.equal(resolveFootballLifecycle(event("live"), { state: "live" }, now), "live");
  assert.equal(resolveFootballLifecycle(event("live"), { state: "halftime" }, now), "halftime");
  assert.equal(resolveFootballLifecycle(event("live"), { statusText: "2OT" }, now), "overtime");
  assert.equal(resolveFootballLifecycle(event("delayed"), undefined, now), "delayed");
  assert.equal(resolveFootballLifecycle(event("suspended"), undefined, now), "suspended");
  const finishedAt = now.toISOString();
  const final = event("final", now, { metadata: { finalizedAt: finishedAt } });
  assert.equal(resolveFootballLifecycle(final, undefined, now), "final");
  assert.equal(resolveFootballLifecycle(final, undefined, new Date(now.getTime() + FOOTBALL_FINAL_HOLD_MS + 1)), "postgame");
});
