import test from "node:test";
import assert from "node:assert/strict";
import type { SportsEvent, SportsSnapshot } from "@/core/contracts/Sports";
import { neutralPreferences } from "@/services/settings/preferences";
import { buildSportsSignals, buildSportsSummaryNotifications, sportsSignalState, type SportsSignalState } from "./signals";

const now = new Date("2026-09-05T12:00:00.000Z");
function snapshot(events: SportsEvent[]): SportsSnapshot { return { live: events.filter((event) => event.status === "live" || event.status === "delayed"), upcoming: events.filter((event) => event.status === "scheduled" || event.status === "pregame"), recent: events.filter((event) => event.status === "final" || event.status === "postponed" || event.status === "cancelled"), featured: [], standings: {}, providerErrors: [], sources: [], lastUpdated: now }; }
function game(overrides: Partial<SportsEvent> = {}): SportsEvent { return { id: "espn:game-1", sport: "nfl", title: "Green Bay Packers at Chicago Bears", start: new Date("2026-09-05T12:20:00.000Z"), status: "scheduled", source: "espn", awayTeam: { id: "9", name: "Green Bay Packers", score: 0 }, homeTeam: { id: "6", name: "Chicago Bears", score: 0 }, ...overrides }; }
function preferences() { const value = structuredClone(neutralPreferences); value.sports.followedTeams = [{ sport: "nfl", provider: "espn", teamId: "9", label: "Green Bay Packers" }]; value.sports.notifications = { ...value.sports.notifications, gameStartingSoon: true, gameStarted: true, finalResult: true, delayPostponement: true, closeGameLate: true }; return value; }

test("starting-soon signals are favorite-scoped and deduplicated", () => {
  const event = game(); const first = buildSportsSignals(snapshot([event]), preferences(), now); const second = buildSportsSignals(snapshot([event]), preferences(), now, {}, new Set(first.map((item) => item.id)));
  assert.equal(first.length, 1); assert.equal(first[0].category, "GAME_STARTING_SOON"); assert.equal(second.length, 0);
  const other = buildSportsSignals(snapshot([{ ...event, id: "other", awayTeam: { id: "1", name: "Other Team", score: 0 } }]), preferences(), now); assert.equal(other.length, 0);
});

test("live and final transitions emit once and include deterministic result", () => {
  const scheduled = game(); const live = game({ status: "live", metadata: { period: 4, clock: "07:00" }, awayTeam: { id: "9", name: "Green Bay Packers", score: 20 }, homeTeam: { id: "6", name: "Chicago Bears", score: 14 } }); const previous: SportsSignalState = sportsSignalState(snapshot([scheduled]));
  const liveSignals = buildSportsSignals(snapshot([live]), preferences(), now, previous); assert.equal(liveSignals.some((item) => item.category === "GAME_LIVE"), true);
  const final = game({ status: "final", awayTeam: { id: "9", name: "Green Bay Packers", score: 27 }, homeTeam: { id: "6", name: "Chicago Bears", score: 20 } });
  const result = buildSportsSignals(snapshot([final]), preferences(), now, sportsSignalState(snapshot([live]))); assert.equal(result.some((item) => item.category === "FINAL_RESULT"), true); assert.match(result.find((item) => item.category === "FINAL_RESULT")?.body ?? "", /wins 27-20/);
});

test("close-game thresholds require reliable late-game state", () => {
  const close = game({ status: "live", metadata: { period: 4, clock: "05:00" }, awayTeam: { id: "9", name: "Green Bay Packers", score: 20 }, homeTeam: { id: "6", name: "Chicago Bears", score: 17 } });
  assert.equal(buildSportsSignals(snapshot([close]), preferences(), now, sportsSignalState(snapshot([{ ...close, awayTeam: { id: "9", name: "Green Bay Packers", score: 19 } }]))).some((item) => item.category === "CLOSE_GAME"), true);
  const early = { ...close, metadata: { period: 2, clock: "05:00" } }; assert.equal(buildSportsSignals(snapshot([early]), preferences(), now, sportsSignalState(snapshot([{ ...early, awayTeam: { id: "9", name: "Green Bay Packers", score: 19 } }]))).some((item) => item.category === "CLOSE_GAME"), false);
});

test("delay and cold start behavior avoid fabricated historical alerts", () => {
  const postponed = game({ status: "postponed" }); assert.equal(buildSportsSignals(snapshot([postponed]), preferences(), now).length, 0);
  const delayed = game({ status: "delayed" }); const previous = sportsSignalState(snapshot([{ ...delayed, status: "scheduled" }])); assert.equal(buildSportsSignals(snapshot([delayed]), preferences(), now, previous).some((item) => item.category === "EVENT_DELAYED"), true);
});

test("favorite driver results require provider finishing data", () => {
  const value = preferences(); value.sports.followedTeams = []; value.sports.followedDrivers = [{ id: "max-verstappen", label: "Max Verstappen", sport: "f1" }]; value.sports.notifications = { ...value.sports.notifications, followedResult: true };
  const event: SportsEvent = { id: "jolpica:race-1", sport: "f1", title: "Italian Grand Prix", start: now, status: "final", source: "jolpica", metadata: { sessionKind: "race", driverId: "max-verstappen", finishingPosition: 2, points: 18 } };
  const previous: SportsSignalState = { [event.id]: { status: "live" } };
  const signals = buildSportsSignals(snapshot([event]), value, now, previous);
  assert.equal(signals.some((item) => item.category === "FAVORITE_DRIVER_RESULT"), true);
  assert.match(signals.find((item) => item.category === "FAVORITE_DRIVER_RESULT")?.body ?? "", /P2/);
});

test("stale snapshots cannot create sports signals", () => {
  const event = game(); const stale = { ...snapshot([event]), lastUpdated: new Date("2026-09-05T11:00:00.000Z") };
  assert.deepEqual(buildSportsSignals(stale, preferences(), now), []);
});

test("summary notifications exclude unrelated team-sport games", () => {
  const value = preferences();
  value.sports.followedTeams = [{ sport: "nfl", provider: "espn", teamId: "9", label: "Green Bay Packers" }];
  const other = game({ id: "other", title: "Chicago Bears at Detroit Lions", start: new Date("2026-09-05T13:00:00Z"), awayTeam: { id: "6", name: "Chicago Bears" }, homeTeam: { id: "10", name: "Detroit Lions" } });
  const items = buildSportsSummaryNotifications(snapshot([game(), other]), value, now);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "NFL · TODAY");
  assert.equal(items.some((item) => item.body?.includes("Green Bay Packers")), true);
});

test("summary notifications keep racing sports session-based", () => {
  const value = preferences();
  value.sports.followedTeams = [];
  const f1 = game({ id: "f1", sport: "f1", title: "Japanese Grand Prix · Qualifying", metadata: { sessionKind: "qualifying" }, start: new Date("2026-09-05T13:00:00Z") });
  const nascar = game({ id: "nascar", sport: "nascar", title: "NASCAR Cup Series · Race", start: new Date("2026-09-05T14:00:00Z") });
  const items = buildSportsSummaryNotifications(snapshot([f1, nascar]), value, now);
  assert.equal(items.length, 2);
});

test("disabled sports do not produce summary notifications", () => {
  const value = preferences();
  value.sports.enabledSports = value.sports.enabledSports.filter((sport) => sport !== "nfl");
  assert.deepEqual(buildSportsSummaryNotifications(snapshot([game()]), value, now), []);
});
