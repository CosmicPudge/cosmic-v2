import test from "node:test";
import assert from "node:assert/strict";
import { FOOTBALL_VENUES, resolveFootballVenue, footballVenueAssetPath } from "./football";

test("Utah State and Boise State resolve their primary football venues", () => {
  assert.equal(resolveFootballVenue({ sport: "college-football", homeTeam: { id: "328", name: "Utah State Aggies" } })?.canonicalName, "Maverik Stadium");
  assert.equal(resolveFootballVenue({ sport: "college-football", venue: "Albertsons Stadium", homeTeam: { id: "328", name: "Utah State Aggies" } })?.canonicalName, "Albertsons Stadium");
});

test("venue aliases and neutral sites are deterministic", () => {
  assert.equal(resolveFootballVenue({ sport: "college-football", venue: "Bronco Stadium" })?.id, "cfb-albertsons-stadium");
  assert.equal(resolveFootballVenue({ sport: "college-football", venue: "Rose Bowl", homeTeam: { id: "328", name: "Utah State Aggies" }, neutralSite: true })?.neutralSite, true);
  assert.equal(resolveFootballVenue({ sport: "college-football", venue: "Unknown Bowl", homeTeam: { id: "328", name: "Utah State Aggies" }, neutralSite: true }), undefined);
});

test("registry entries expose honest asset status and safe fallback", () => {
  const albertsons = FOOTBALL_VENUES.find((venue) => venue.id === "cfb-albertsons-stadium");
  assert.equal(albertsons?.assetStatus, "missing");
  assert.equal(footballVenueAssetPath(albertsons), "/dashboard/sports/stadium.webp");
  assert.ok(FOOTBALL_VENUES.every((venue) => venue.canonicalName && venue.id));
});
