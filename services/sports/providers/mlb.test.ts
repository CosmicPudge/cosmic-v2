import assert from "node:assert/strict";
import test from "node:test";
import { isMlbPostseasonGame } from "./mlb";

test("MLB postseason fallback recognizes official game markers", () => {
  assert.equal(isMlbPostseasonGame({ gameType: "P" }), true);
  assert.equal(isMlbPostseasonGame({ seriesDescription: "American League Division Series" }), true);
  assert.equal(isMlbPostseasonGame({ gameType: "R", seriesDescription: "Regular Season" }), false);
});
