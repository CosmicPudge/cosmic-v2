import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCollegeFootballDirectoryPayload } from "./college-football-directory";

test("normalizes provider teams with stable IDs and preserves FBS/FCS distinctions", () => {
  const entries = normalizeCollegeFootballDirectoryPayload({ sports: [{ leagues: [{ teams: [
    { team: { id: "254", displayName: "Utah Utes", abbreviation: "UTAH", conference: { name: "Big 12" }, subdivision: "FBS", logos: [{ href: "https://a.espncdn.com/i/teamlogos/ncaa/500/254.png" }] } },
    { team: { id: "328", displayName: "Utah State Aggies", abbreviation: "USU", conference: { name: "Mountain West" }, subdivision: "FBS" } },
    { team: { id: "314", displayName: "Utah Tech Trailblazers", abbreviation: "UTU", conference: { name: "United Athletic" }, subdivision: "FCS" } },
  ] }] }] });
  assert.deepEqual(entries.map((entry) => [entry.providerId, entry.name, entry.subdivision]), [["328", "Utah State Aggies", "FBS"], ["314", "Utah Tech Trailblazers", "FCS"], ["254", "Utah Utes", "FBS"]]);
  assert.equal(entries.find((entry) => entry.providerId === "254")?.logoUrl, "https://a.espncdn.com/i/teamlogos/ncaa/500/254.png");
});

test("rejects provider logo URLs outside the approved ESPN CDN", () => {
  const entries = normalizeCollegeFootballDirectoryPayload({ teams: [{ team: { id: "1", displayName: "Test School", logos: [{ href: "https://evil.example/logo.svg" }] } }] });
  assert.equal(entries[0]?.logoUrl, undefined);
});

test("filters inactive and all-star pseudo teams while retaining every valid active candidate", () => {
  const entries = normalizeCollegeFootballDirectoryPayload({ teams: [
    { team: { id: "active", displayName: "Active School", isActive: true, isAllStar: false } },
    { team: { id: "inactive", displayName: "Inactive School", isActive: false } },
    { team: { id: "all-star", displayName: "All Star Team", isActive: true, isAllStar: true } },
  ] });
  assert.deepEqual(entries.map((entry) => entry.providerId), ["active"]);
});
