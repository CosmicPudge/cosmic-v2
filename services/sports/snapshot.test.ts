import test from "node:test";
import assert from "node:assert/strict";
import type { SportsEvent } from "@/core/contracts/Sports";
import { dedupeSportsEvents } from "./snapshot";

const game = (id: string, provider: string): SportsEvent => ({ id, sport: "college-football", title: "Utah Utes at BYU Cougars", start: new Date("2026-09-26T18:00:00Z"), status: "scheduled", homeTeam: { id: "252", name: "BYU Cougars" }, awayTeam: { id: "254", name: "Utah Utes" }, source: provider });

test("deduplicates a football matchup returned by two favorite team schedules", () => {
  assert.equal(dedupeSportsEvents([game("utah-provider:event-1", "espn"), game("byu-provider:event-1", "espn")]).length, 1);
});

test("keeps distinct football games with different dates", () => {
  const second = { ...game("event-2", "espn"), start: new Date("2026-10-03T18:00:00Z") };
  assert.equal(dedupeSportsEvents([game("event-1", "espn"), second]).length, 2);
});

function duplicate(status: SportsEvent["status"], provider: string, refresh: string, rich = false): SportsEvent {
  return {
    id: provider === "espn-college-football-scoreboard" ? "espn:college-football:401860898" : "espn:college-football:401860898",
    sport: "college-football",
    title: "Utah State Aggies at Boise State Broncos",
    start: new Date("2026-10-03T23:30:00Z"),
    status,
    homeTeam: { id: "68", name: "Boise State Broncos", ...(rich ? { score: 21 } : {}) },
    awayTeam: { id: "328", name: "Utah State Aggies", ...(rich ? { score: 14 } : {}) },
    source: "espn",
    provider,
    metadata: { gamePk: "401860898", lastProviderRefresh: refresh, ...(rich ? { period: 3, clock: "04:22", possessionTeamId: "328", down: 2, distance: 7, downDistanceText: "2nd & 7" } : {}) },
  };
}

test("same CFB game ID merges team schedule and scoreboard into one event", () => {
  const merged = dedupeSportsEvents([duplicate("scheduled", "espn-football-college-football-328", "2026-10-03T23:36:00Z"), duplicate("live", "espn-college-football-scoreboard", "2026-10-03T23:37:00Z", true)]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.id, "espn:college-football:401860898");
  assert.equal(merged[0]?.status, "live");
  assert.equal(merged[0]?.homeTeam?.score, 21);
  assert.equal(merged[0]?.metadata?.period, 3);
  assert.equal(merged[0]?.metadata?.clock, "04:22");
});

test("fresh live and final records beat stale scheduled CFB records", () => {
  const live = dedupeSportsEvents([duplicate("scheduled", "espn-football-college-football-328", "2026-10-03T23:40:00Z"), duplicate("live", "espn-college-football-scoreboard", "2026-10-03T23:39:00Z", true)])[0];
  assert.equal(live?.status, "live");
  const final = dedupeSportsEvents([duplicate("scheduled", "espn-football-college-football-328", "2026-10-03T23:40:00Z"), duplicate("final", "espn-college-football-scoreboard", "2026-10-03T23:39:00Z", true)])[0];
  assert.equal(final?.status, "final");
});

test("explicit delayed state is preserved over scheduled duplicate", () => {
  const merged = dedupeSportsEvents([duplicate("scheduled", "espn-football-college-football-328", "2026-10-03T23:40:00Z"), duplicate("delayed", "espn-college-football-scoreboard", "2026-10-03T23:41:00Z")]);
  assert.equal(merged[0]?.status, "delayed");
});
