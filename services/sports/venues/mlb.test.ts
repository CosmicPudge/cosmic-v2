import test from "node:test";
import assert from "node:assert/strict";
import { resolveMlbVenue } from "./mlb";

test("MLB venue resolution is home-team/venue aware", () => {
  assert.equal(resolveMlbVenue({ homeTeamId: "108" })?.canonicalName, "Angel Stadium");
  assert.equal(resolveMlbVenue({ homeTeamAbbreviation: "NYY" })?.canonicalName, "Yankee Stadium");
  assert.equal(resolveMlbVenue({ homeTeamAbbreviation: "SEA" })?.canonicalName, "T-Mobile Park");
  assert.equal(resolveMlbVenue({ homeTeamAbbreviation: "NYY", venue: "Oriole Park at Camden Yards" })?.canonicalName, "Yankee Stadium");
});
