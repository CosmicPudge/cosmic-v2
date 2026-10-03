import test from "node:test";
import assert from "node:assert/strict";
import type { SportsEvent } from "@/core/contracts/Sports";
import { neutralPreferences } from "@/services/settings/preferences";
import { eventMatchesKioskPreferences, favoriteFirstSections, isFavoriteEvent } from "./preferences";

function event(id: string, status: SportsEvent["status"], start: string, overrides: Partial<SportsEvent> = {}): SportsEvent {
  return { id, sport: "nfl", title: id, start: new Date(start), status, source: "test", ...overrides };
}

test("favorite-first sections rank live, next, and recent without duplicate IDs", () => {
  const preferences = structuredClone(neutralPreferences);
  preferences.sports.followedTeams = [{ sport: "nfl", provider: "espn", teamId: "9", label: "Green Bay Packers" }];
  const sections = favoriteFirstSections([
    event("other-live", "live", "2026-09-05T12:00:00Z"),
    event("favorite-live", "live", "2026-09-05T13:00:00Z", { homeTeam: { id: "9", name: "Green Bay Packers" } }),
    event("favorite-next", "scheduled", "2026-09-06T13:00:00Z", { homeTeam: { id: "9", name: "Green Bay Packers" } }),
    event("favorite-final", "final", "2026-09-04T13:00:00Z", { homeTeam: { id: "9", name: "Green Bay Packers" } }),
    event("favorite-final", "final", "2026-09-04T13:00:00Z", { homeTeam: { id: "9", name: "Green Bay Packers" } }),
  ], preferences);
  assert.deepEqual(sections.now.map((item) => item.id), ["favorite-live", "other-live"]);
  assert.deepEqual(sections.next.map((item) => item.id), ["favorite-next"]);
  assert.deepEqual(sections.recent.map((item) => item.id), ["favorite-final"]);
});

test("motorsport favorites use scoped driver and constructor preferences", () => {
  const preferences = structuredClone(neutralPreferences);
  preferences.sports.followedDrivers = [{ id: "max-verstappen", label: "Max Verstappen", sport: "f1" }];
  preferences.sports.followedConstructors = [{ id: "red-bull-racing", label: "Red Bull Racing", sport: "f1" }];
  const race = event("race", "scheduled", "2026-09-06T13:00:00Z", { sport: "f1", metadata: { competition: "Italian Grand Prix" } });
  assert.equal(isFavoriteEvent(race, preferences), true);
});

test("legacy untyped F1 favorites remain compatible", () => {
  const preferences = structuredClone(neutralPreferences);
  preferences.sports.followedDrivers = [{ id: "legacy-max", label: "Max Verstappen" }];
  const race = event("race", "scheduled", "2026-09-06T13:00:00Z", { sport: "f1" });
  assert.equal(isFavoriteEvent(race, preferences), true);
});

test("earlier upcoming event beats a later favorite", () => {
  const preferences = structuredClone(neutralPreferences);
  preferences.sports.followedTeams = [{ sport: "nfl", provider: "espn", teamId: "9", label: "Green Bay Packers" }];
  const sections = favoriteFirstSections([
    event("packers", "scheduled", "2026-09-06T13:00:00Z", { homeTeam: { id: "9", name: "Green Bay Packers" } }),
    event("earlier", "scheduled", "2026-09-05T13:00:00Z"),
  ], preferences);
  assert.equal(sections.next[0]?.id, "earlier");
});

test("kiosk team-sport eligibility is hard favorite-only", () => {
  const preferences = structuredClone(neutralPreferences);
  preferences.sports.followedTeams = [{ sport: "mlb", provider: "mlb", teamId: "108", label: "Los Angeles Angels" }];
  const favorite = event("angels", "scheduled", "2026-10-03T01:00:00Z", { sport: "mlb", homeTeam: { id: "108", name: "Los Angeles Angels" }, awayTeam: { id: "133", name: "Oakland Athletics" } });
  const unrelated = event("unrelated", "live", "2026-10-02T23:00:00Z", { sport: "mlb", homeTeam: { id: "145", name: "Chicago White Sox" }, awayTeam: { id: "139", name: "Cleveland Guardians" } });
  assert.equal(eventMatchesKioskPreferences(favorite, preferences), true);
  assert.equal(eventMatchesKioskPreferences(unrelated, preferences), false);
  assert.equal(eventMatchesKioskPreferences({ ...favorite, sport: "f1" }, preferences), true);
  assert.equal(eventMatchesKioskPreferences({ ...favorite, sport: "nascar" }, preferences), true);
});

test("Utah State followed makes CFB eligible while unrelated games are excluded", () => {
  const preferences = structuredClone(neutralPreferences);
  preferences.sports.followedTeams = [{ sport: "college-football", provider: "espn", teamId: "328", label: "Utah State Aggies" }];
  const usu = event("usu", "scheduled", "2026-10-03T19:00:00Z", { sport: "college-football", homeTeam: { id: "328", name: "Utah State Aggies" }, awayTeam: { id: "68", name: "Boise State Broncos" } });
  const alabama = event("alabama", "scheduled", "2026-10-03T17:00:00Z", { sport: "college-football", homeTeam: { id: "333", name: "Alabama Crimson Tide" }, awayTeam: { id: "61", name: "Georgia Bulldogs" } });
  assert.equal(eventMatchesKioskPreferences(usu, preferences), true);
  assert.equal(eventMatchesKioskPreferences(alabama, preferences), false);
});

test("kiosk team sports with no followed teams have no eligible events", () => {
  const preferences = structuredClone(neutralPreferences);
  const game = event("usu", "scheduled", "2026-10-03T19:00:00Z", { sport: "college-football", homeTeam: { id: "328", name: "Utah State Aggies" }, awayTeam: { id: "68", name: "Boise State Broncos" } });
  assert.equal(eventMatchesKioskPreferences(game, preferences), false);
});
