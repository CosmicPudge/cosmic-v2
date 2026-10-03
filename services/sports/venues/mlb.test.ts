import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolveMlbVenue, MLB_VENUES } from "./mlb";

test("MLB venue resolution is home-team/venue aware", () => {
  assert.equal(resolveMlbVenue({ homeTeamId: "108" })?.canonicalName, "Angel Stadium");
  assert.equal(resolveMlbVenue({ homeTeamAbbreviation: "NYY" })?.canonicalName, "Yankee Stadium");
  assert.equal(resolveMlbVenue({ homeTeamAbbreviation: "SEA" })?.canonicalName, "T-Mobile Park");
  assert.equal(resolveMlbVenue({ venueId: "3313", homeTeamAbbreviation: "BAL", venue: "Oriole Park at Camden Yards" })?.canonicalName, "Yankee Stadium");
  assert.equal(resolveMlbVenue({ venue: "Minute Maid Park" })?.canonicalName, "Daikin Park");
  assert.equal(resolveMlbVenue({ venue: "International Baseball Stadium", homeTeamAbbreviation: "NYY" }), undefined);
  assert.equal(resolveMlbVenue({ homeTeamAbbreviation: "NYY" })?.canonicalName, "Yankee Stadium");
});

test("every current MLB club has one unique venue ID and local image", () => {
  assert.equal(MLB_VENUES.length, 30);
  assert.equal(new Set(MLB_VENUES.map((venue) => venue.venueId)).size, 30);
  for (const venue of MLB_VENUES) {
    assert.equal(venue.status, "current-primary");
    assert.equal(existsSync(`${process.cwd()}/public${venue.imagePath}`), true, venue.canonicalName);
  }
});
