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
