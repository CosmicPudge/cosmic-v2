import assert from "node:assert/strict";
import test from "node:test";
import type { SportsEvent } from "@/core/contracts/Sports";
import { normalizeKioskSportsEvent, selectKioskSportsEvent } from "./kioskSelection";

const now = new Date("2026-10-02T12:00:00Z");
function event(id: string, sport: SportsEvent["sport"], start: string, extra: Partial<SportsEvent> = {}): SportsEvent {
  return { id, sport, title: extra.title ?? id, start: new Date(start), status: extra.status ?? "scheduled", source: "test", ...extra };
}

test("live events beat future events across tracked sports", () => {
  const selected = selectKioskSportsEvent([event("race", "f1", "2026-10-03T12:00:00Z"), event("game", "nfl", "2026-10-02T13:00:00Z", { status: "live" })], now);
  assert.equal(selected?.event.id, "game");
});

test("upcoming events are ordered by actual start time across sports", () => {
  const selected = selectKioskSportsEvent([event("later-race", "f1", "2026-10-05T12:00:00Z"), event("first-game", "mlb", "2026-10-02T14:00:00Z")], now);
  assert.equal(selected?.event.id, "first-game");
});

test("Packers and Angels receive favorite priority when timing is equal", () => {
  const selected = selectKioskSportsEvent([
    event("other-nfl", "nfl", "2026-10-02T14:00:00Z", { homeTeam: { name: "Chicago Bears" }, awayTeam: { name: "Detroit Lions" } }),
    event("packers", "nfl", "2026-10-02T14:00:00Z", { homeTeam: { name: "Green Bay Packers" }, awayTeam: { name: "Tampa Bay Buccaneers" } }),
  ], now);
  assert.equal(selected?.event.id, "packers");
});

test("MLB postseason remains eligible when the Angels are inactive", () => {
  const selected = selectKioskSportsEvent([event("alds", "mlb", "2026-10-02T14:00:00Z", { title: "ALDS Game 2: Yankees vs Orioles", metadata: { seasonType: "Postseason", competition: "ALDS" } })], now);
  assert.equal(selected?.eventType, "POSTSEASON");
  assert.equal(selected?.backgroundKey, "mlb-yankees");
});

test("F1 session importance ranks race over sprint, qualifying, and practice", () => {
  const sessions = ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Sprint", "Race"].map((title, index) => normalizeKioskSportsEvent(event(title, "f1", `2026-10-03T${String(14 + index).padStart(2, "0")}:00:00Z`, { title }))!);
  assert.deepEqual(sessions.sort((a, b) => b.importance - a.importance).map((item) => item.eventType), ["RACE", "SPRINT", "QUALIFYING", "PRACTICE3", "PRACTICE2", "PRACTICE1"]);
});

test("NASCAR race outranks qualifying and practice", () => {
  const sessions = ["Practice", "Qualifying", "Race"].map((title, index) => normalizeKioskSportsEvent(event(title, "nascar", `2026-10-03T${String(14 + index).padStart(2, "0")}:00:00Z`, { title }))!);
  assert.deepEqual(sessions.sort((a, b) => b.importance - a.importance).map((item) => item.eventType), ["RACE", "QUALIFYING", "PRACTICE"]);
});

test("venue-aware background keys cover each tracked sport", () => {
  assert.equal(normalizeKioskSportsEvent(event("nfl", "nfl", "2026-10-03T12:00:00Z", { homeTeam: { name: "Green Bay Packers", abbreviation: "GB" } }))?.backgroundKey, "nfl-gb");
  assert.equal(normalizeKioskSportsEvent(event("f1", "f1", "2026-10-03T12:00:00Z", { venue: "Sepang International Circuit", metadata: { country: "Malaysia" } }))?.backgroundKey, "f1-malaysia");
  assert.equal(normalizeKioskSportsEvent(event("nascar", "nascar", "2026-10-03T12:00:00Z", { venue: "Daytona International Speedway" }))?.backgroundKey, "nascar-daytona");
  assert.equal(normalizeKioskSportsEvent(event("mlb", "mlb", "2026-10-03T12:00:00Z", { homeTeam: { name: "Los Angeles Angels" }, awayTeam: { name: "Seattle Mariners" } }))?.backgroundKey, "mlb-angels");
});
