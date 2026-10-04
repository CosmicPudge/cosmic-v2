import assert from "node:assert/strict";
import test from "node:test";
import type { FootballLiveData } from "@/core/contracts/sports/Football";
import { footballGameStats, footballStatRows } from "./stats";

function live(overrides: Partial<FootballLiveData> = {}): FootballLiveData {
  return {
    sport: "nfl", eventId: "event", generatedAt: new Date().toISOString(), stale: false, sources: [],
    away: { team: { id: "away", name: "Away" }, score: 7 }, home: { team: { id: "home", name: "Home" }, score: 14 }, situation: {},
    teamStats: [{ teamId: "away", teamAbbreviation: "AWY", stats: { totalYards: 184, passingYards: 112, rushingYards: 72, firstDowns: 10, turnovers: 1, thirdDownMade: 3, thirdDownAttempts: 7, fourthDownMade: 0, fourthDownAttempts: 1, penalties: 5, penaltyYards: 42, possessionTime: "26:14" } }, { teamId: "home", teamAbbreviation: "HME", stats: { totalYards: 276, passingYards: 189, rushingYards: 87, firstDowns: 15, turnovers: 0 } }],
    playerStats: [{ name: "QB", playerId: "qb", passing: { completions: 14, attempts: 21, yards: 186, touchdowns: 2 } }, { name: "RB", playerId: "rb", rushing: { attempts: 12, yards: 74 } }, { name: "WR", playerId: "wr", receiving: { receptions: 5, yards: 83, touchdowns: 1 } }],
    currentDrive: { plays: 6, yards: 41, elapsedTime: "2:18", result: "In progress" }, drives: [{ teamAbbreviation: "AWY", result: "Punt" }],
    ...overrides,
  };
}

test("normalizes team comparison rows and omits unsupported empty rows", () => {
  const stats = footballGameStats(live());
  const rows = footballStatRows(stats?.teamStats);
  assert.deepEqual(rows.slice(0, 6).map((row) => row.label), ["Total Yards", "Passing", "Rushing", "First Downs", "Turnovers", "3rd Down"]);
  assert.deepEqual(rows.find((row) => row.label === "3rd Down")?.values, ["3/7", undefined]);
  assert.equal(rows.some((row) => row.label === "4th Down"), true);
});

test("normalizes provider player categories without inventing partial leader lines", () => {
  const leaders = footballGameStats(live())?.playerLeaders ?? [];
  assert.deepEqual(leaders.map((leader) => leader.category), ["passing", "rushing", "receiving"]);
  assert.equal(leaders[0]?.statLine, "14/21 · 186 YDS · 2 TD");
  assert.equal(leaders[1]?.statLine, "12 CAR · 74 YDS");
});

test("preserves current and recent drives and stale state", () => {
  const stats = footballGameStats(live({ stale: true }));
  assert.equal(stats?.recentDrives?.length, 1);
  assert.equal(stats?.stale, true);
});

test("red-zone, scoring, and win probability remain optional", () => {
  const source = live({ stats: { redZone: [{ teamId: "away", stats: { redZoneMade: 1, redZoneAttempts: 2 } }], winProbability: { away: .28, home: .72 }, scoringByPeriod: [{ period: 1, away: 0, home: 7 }] } });
  assert.equal(footballGameStats(source)?.redZone, undefined);
  assert.equal(source.stats?.winProbability?.home, .72);
  assert.equal(source.stats?.scoringByPeriod?.[0]?.home, 7);
});
