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
