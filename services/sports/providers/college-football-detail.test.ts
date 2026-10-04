import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCollegeFootballSummary } from "./college-football-detail";

test("normalizes real ESPN college football summary fields without inventing detail", () => {
  const summary = normalizeCollegeFootballSummary({
    header: { competitions: [{ status: { type: { detail: "Final" } }, competitors: [
      { homeAway: "away", score: "14", team: { id: "70", displayName: "Idaho Vandals", abbreviation: "IDHO" } },
      { homeAway: "home", score: "66", team: { id: "254", displayName: "Utah Utes", abbreviation: "UTAH" } },
    ], venue: { fullName: "Rice-Eccles Stadium", address: { city: "Salt Lake City", state: "UT" } } }] },
    plays: [{ text: "Touchdown Utah", scoringPlay: true }],
  });
  assert.equal(summary?.away.score, 14);
  assert.equal(summary?.home.score, 66);
  assert.equal(summary?.venue?.name, "Rice-Eccles Stadium");
  assert.deepEqual(summary?.scoringPlays, ["Touchdown Utah"]);
  assert.equal(summary?.leaders, undefined);
});

test("keeps unknown scores unknown and rejects sentinel rankings", () => {
  const summary = normalizeCollegeFootballSummary({
    header: { competitions: [{ status: { type: { detail: "3rd Quarter", period: 3, displayClock: "05:52" } }, situation: { possession: { id: "68" }, down: 3, distance: 4, downDistanceText: "3rd & 4 at BSU 37", possessionText: "BSU 37" }, competitors: [
      { homeAway: "away", team: { id: "328", displayName: "Utah State Aggies", abbreviation: "USU" }, curatedRank: { current: 99 } },
      { homeAway: "home", score: "21", team: { id: "68", displayName: "Boise State Broncos", abbreviation: "BOIS" }, curatedRank: { current: 22 } },
    ] }] },
    plays: [{ id: "play-1", text: "Pass complete for 8 yards" }],
  });
  assert.equal(summary?.away.score, undefined);
  assert.equal(summary?.home.score, 21);
  assert.equal(summary?.situation?.possessionTeamId, "68");
  assert.equal(summary?.situation?.fieldPosition?.display, "BSU 37");
  assert.deepEqual(summary?.rankings, [{ team: "Boise State Broncos", rank: 22 }]);
  assert.equal(summary?.normalizedPlays?.[0]?.id, "play-1");
});

test("normalizes CFB quarter, clock, possession, and down-distance when supplied", () => {
  const summary = normalizeCollegeFootballSummary({
    header: { competitions: [{ status: { type: { detail: "3rd Quarter", period: 3, displayClock: "08:42" } }, situation: { period: 3, displayClock: "08:42", possession: "328", down: 2, distance: 7, downDistanceText: "2nd & 7 at USU 35", possessionText: "USU 35" }, competitors: [
      { homeAway: "away", score: "10", team: { id: "68", displayName: "Boise State Broncos", abbreviation: "BSU" } },
      { homeAway: "home", score: "14", team: { id: "328", displayName: "Utah State Aggies", abbreviation: "USU" } },
    ] }] },
  });
  assert.equal(summary?.period, 3);
  assert.equal(summary?.clock, "08:42");
  assert.equal(summary?.situation?.possessionTeamId, "328");
  assert.equal(summary?.situation?.downDistanceText, "2nd & 7 at USU 35");
  assert.equal(summary?.situation?.fieldPosition?.display, "USU 35");
});

test("normalizes bounded CFB detail availability and penalty state", () => {
  const summary = normalizeCollegeFootballSummary({
    header: { id: "401860898", competitions: [{ status: { type: { detail: "2nd Quarter", period: 2, displayClock: "14:40" } }, situation: { period: 2, displayClock: "14:40", possession: "328", down: 2, distance: 7, downDistanceText: "2nd & 7 at USU 35", possessionText: "USU 35" }, competitors: [
      { homeAway: "away", score: "0", team: { id: "68", displayName: "Boise State Broncos", abbreviation: "BSU" } },
      { homeAway: "home", score: "14", team: { id: "328", displayName: "Utah State Aggies", abbreviation: "USU" } },
    ] } ] }, plays: [{ id: "p1", text: "Holding, offense", penalty: true, penaltyYards: 10 }],
  });
  assert.equal(summary?.eventId, "401860898"); assert.equal(summary?.sport, "college-football"); assert.equal(summary?.home.score, 14); assert.equal(summary?.penalty?.yards, 10); assert.equal(summary?.sourceAvailability?.possession, true); assert.equal(summary?.sourceAvailability?.lastPlay, true);
});
