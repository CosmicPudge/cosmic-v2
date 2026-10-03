import assert from "node:assert/strict";
import test from "node:test";
import type { SportsEvent } from "@/core/contracts/Sports";
import type { BaseballLiveData } from "@/core/contracts/sports/Baseball";
import { createSportsScoreObservation, detectSportsCelebration } from "./sportsCelebration";

const event = (overrides: Partial<SportsEvent> = {}): SportsEvent => ({
  id: "game-1", sport: "mlb", title: "Cleveland Guardians at Los Angeles Angels", start: new Date("2026-10-03T01:00:00Z"), status: "live", source: "test",
  awayTeam: { id: "114", name: "Cleveland Guardians", abbreviation: "CLE", score: 0 },
  homeTeam: { id: "108", name: "Los Angeles Angels", abbreviation: "LAA", score: 0 }, ...overrides,
});

const baseball = (eventId: string, away: number, home: number, overrides: Partial<BaseballLiveData> = {}): BaseballLiveData => ({
  eventId, sport: "mlb", generatedAt: new Date().toISOString(), stale: false, sources: [],
  away: { team: { id: "114", name: "Cleveland Guardians", abbreviation: "CLE" }, score: away },
  home: { team: { id: "108", name: "Los Angeles Angels", abbreviation: "LAA" }, score: home }, ...overrides,
});

test("first score snapshot establishes a baseline", () => {
  assert.equal(detectSportsCelebration(null, createSportsScoreObservation(event(), baseball("game-1", 1, 0), 1_000), event()), null);
});

test("later score increase identifies the scoring team and colors", () => {
  const game = event();
  const previous = createSportsScoreObservation(game, baseball("game-1", 0, 0), 1_000);
  const current = createSportsScoreObservation(game, baseball("game-1", 2, 0), 3_000);
  const celebration = detectSportsCelebration(previous, current, game);
  assert.equal(celebration?.kind, "score");
  assert.equal(celebration?.teamId, "114");
  assert.equal(celebration?.label, "SCORE");
  assert.equal(celebration?.primaryColor, "#00385D");
});

test("event changes reset identity and never celebrate across games", () => {
  const previous = createSportsScoreObservation(event(), baseball("game-1", 1, 0), 1_000);
  const nextEvent = event({ id: "game-2" });
  const current = createSportsScoreObservation(nextEvent, baseball("game-2", 2, 0), 2_000);
  assert.equal(detectSportsCelebration(previous, current, nextEvent), null);
});

test("stale recovery and long gaps do not replay catch-up scores", () => {
  const game = event();
  const stale = createSportsScoreObservation(game, baseball("game-1", 1, 0, { stale: true }), 1_000);
  const current = createSportsScoreObservation(game, baseball("game-1", 5, 1), 3_000);
  assert.equal(detectSportsCelebration(stale, current, game), null);
  const baseline = createSportsScoreObservation(game, baseball("game-1", 1, 0), 1_000);
  const afterGap = createSportsScoreObservation(game, baseball("game-1", 2, 0), 100_001);
  assert.equal(detectSportsCelebration(baseline, afterGap, game), null);
});

test("structured home run data triggers one home-run celebration", () => {
  const game = event();
  const previous = createSportsScoreObservation(game, baseball("game-1", 0, 0), 1_000);
  const current = createSportsScoreObservation(game, baseball("game-1", 0, 4, { latestPlay: { id: "play-44", description: "Grand slam home run", eventType: "home_run", scoringPlay: true, runsScored: 4 } }), 3_000);
  const celebration = detectSportsCelebration(previous, current, game);
  assert.equal(celebration?.kind, "home-run");
  assert.equal(celebration?.label, "HOME RUN");
  assert.equal(celebration?.playId, "play-44");
  assert.equal(detectSportsCelebration(current, current, game), null);
});

test("ordinary MLB scoring is not labeled home run", () => {
  const game = event();
  const previous = createSportsScoreObservation(game, baseball("game-1", 0, 0), 1_000);
  const current = createSportsScoreObservation(game, baseball("game-1", 0, 1, { latestPlay: { id: "play-45", description: "Sacrifice fly", eventType: "sac_fly", scoringPlay: true, runsScored: 1 } }), 3_000);
  assert.equal(detectSportsCelebration(previous, current, game)?.kind, "score");
});

test("NFL scoring is supported while racing is unaffected", () => {
  const nfl = event({ id: "nfl-1", sport: "nfl", title: "Packers game", awayTeam: { id: "gb", name: "Green Bay Packers", abbreviation: "GB", score: 0 }, homeTeam: { id: "chi", name: "Chicago Bears", abbreviation: "CHI", score: 0 } });
  const previous = createSportsScoreObservation(nfl, null, 1_000);
  const current = createSportsScoreObservation({ ...nfl, awayTeam: { ...nfl.awayTeam!, score: 7 } }, null, 2_000);
  assert.equal(detectSportsCelebration(previous, current, nfl)?.teamId, "gb");
  const race = event({ sport: "f1" });
  assert.equal(detectSportsCelebration(createSportsScoreObservation(race, null, 1_000), createSportsScoreObservation(race, null, 2_000), race), null);
});
