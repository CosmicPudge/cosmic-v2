import test from "node:test";
import assert from "node:assert/strict";
import type { SportsTeam } from "@/core/contracts/Sports";
import { NFL_TEAM_REGISTRY, initialsForTeam, isRaceSport, resolveSportsTeamIdentity } from "./identity";

test("resolves the existing MLB Angels and Pirates logos", () => {
  const angels = resolveSportsTeamIdentity("mlb", { id: "108", name: "Los Angeles Angels", abbreviation: "LAA" });
  const pirates = resolveSportsTeamIdentity("mlb", { id: "134", name: "Pittsburgh Pirates", abbreviation: "PIT" });
  assert.equal(angels?.logoPath, "/logos/mlb/LAA.svg");
  assert.equal(pirates?.logoPath, "/logos/mlb/PIT.svg");
});

test("contains all 32 canonical NFL identities and resolves Green Bay", () => {
  assert.equal(NFL_TEAM_REGISTRY.length, 32);
  const packers = resolveSportsTeamIdentity("nfl", { id: "9", name: "Green Bay Packers", abbreviation: "GB" });
  assert.equal(packers?.canonicalId, "gb");
  assert.equal(packers?.logoPath, "/sports/nfl/logos/gb.png");
});

test("resolves Utah Utes and keeps Utah State and Utah Tech distinct", () => {
  const utah = resolveSportsTeamIdentity("college-football", { id: "254", name: "Utah Utes", abbreviation: "UTAH" });
  const state = resolveSportsTeamIdentity("college-football", { id: "328", name: "Utah State Aggies" });
  const tech = resolveSportsTeamIdentity("college-football", { id: "3101", name: "Utah Tech Trailblazers" });
  assert.equal(utah?.canonicalId, "utah");
  assert.equal(utah?.logoPath, "/sports/cfb/teams/254.png");
  assert.equal(state?.canonicalId, "328");
  assert.equal(tech?.canonicalId, "3101");
});

test("resolves tricky NFL city and nickname identities to distinct canonical teams", () => {
  const cases = [
    ["Los Angeles Rams", "LAR", "lar"],
    ["Los Angeles Chargers", "LAC", "lac"],
    ["Las Vegas Raiders", "LV", "lv"],
    ["Washington Commanders", "WSH", "wsh"],
    ["Jacksonville Jaguars", "JAX", "jax"],
    ["New England Patriots", "NE", "ne"],
    ["New York Giants", "NYG", "nyg"],
    ["New York Jets", "NYJ", "nyj"],
  ] as const;

  for (const [name, abbreviation, canonicalId] of cases) {
    const identity = resolveSportsTeamIdentity("nfl", { name, abbreviation });
    assert.equal(identity?.canonicalId, canonicalId, name);
  }
});

test("uses clean initials when a logo identity is unknown", () => {
  const unknown: SportsTeam = { name: "Unknown Athletic Club", abbreviation: "UAC" };
  assert.equal(resolveSportsTeamIdentity("nfl", unknown), undefined);
  assert.equal(initialsForTeam(unknown), "UAC");
});

test("motorsport is represented as race events, not team matchups", () => {
  assert.equal(isRaceSport("f1"), true);
  assert.equal(isRaceSport("nascar"), true);
  assert.equal(isRaceSport("mlb"), false);
});
