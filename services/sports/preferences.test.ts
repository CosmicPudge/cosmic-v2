import test from "node:test";
import assert from "node:assert/strict";
import type { SportsEvent } from "@/core/contracts/Sports";
import { neutralPreferences } from "@/services/settings/preferences";
import { favoriteFirstSections, isFavoriteEvent } from "./preferences";

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
