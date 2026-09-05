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
