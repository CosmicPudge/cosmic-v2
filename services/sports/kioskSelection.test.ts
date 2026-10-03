import assert from "node:assert/strict";
import test from "node:test";
import type { SportsEvent } from "@/core/contracts/Sports";
import { describeKioskSportsSelection, normalizeKioskSportsEvent, selectKioskSportsEvent } from "./kioskSelection";
import { selectKioskSportsBackground } from "@/components/os/widgets/shared/kioskSceneBackgrounds";

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

test("Sepang FP3 beats a later Packers game using actual MDT-relative start times", () => {
  const eveningMdt = new Date("2026-10-03T04:00:00Z");
  const fp3 = event("fp3", "f1", "2026-10-03T04:30:00Z", { title: "Malaysian Grand Prix · Practice 3", venue: "Sepang International Circuit", metadata: { sessionType: "Practice 3", country: "Malaysia", circuit: "Sepang International Circuit" } });
  const packers = event("packers-later", "nfl", "2026-10-04T19:00:00Z", { title: "Green Bay Packers at Tampa Bay Buccaneers", awayTeam: { name: "Green Bay Packers", abbreviation: "GB" }, homeTeam: { name: "Tampa Bay Buccaneers", abbreviation: "TB" } });
  const selected = selectKioskSportsEvent([fp3, packers], eveningMdt);
  assert.equal(selected?.event.id, "fp3");
  const diagnostics = describeKioskSportsSelection([fp3, packers], eveningMdt, "America/Denver");
  assert.equal(diagnostics.candidates.find((candidate) => candidate.title.includes("Practice 3"))?.finalRankingPosition, 1);
  assert.equal(diagnostics.candidates.find((candidate) => candidate.title.includes("Practice 3"))?.parsedUtcStart, "2026-10-03T04:30:00.000Z");
});

test("qualifying becomes next after FP3 is complete", () => {
  const now = new Date("2026-10-03T06:00:00Z");
  const fp3 = event("fp3-complete", "f1", "2026-10-03T04:30:00Z", { title: "Malaysian Grand Prix · Practice 3", status: "final", metadata: { sessionType: "Practice 3", country: "Malaysia" } });
  const qualifying = event("qualifying", "f1", "2026-10-03T08:00:00Z", { title: "Malaysian Grand Prix · Qualifying", metadata: { sessionType: "Qualifying", country: "Malaysia" } });
  assert.equal(selectKioskSportsEvent([fp3, qualifying], now)?.event.id, "qualifying");
});

test("NFL is selected after earlier F1 sessions are no longer upcoming", () => {
  const now = new Date("2026-10-04T20:00:00Z");
  const fp3 = event("fp3-finished", "f1", "2026-10-03T04:30:00Z", { title: "Malaysian Grand Prix · Practice 3", status: "final", metadata: { sessionType: "Practice 3", country: "Malaysia" } });
  const packers = event("packers-current", "nfl", "2026-10-04T21:00:00Z", { title: "Green Bay Packers at Tampa Bay Buccaneers", awayTeam: { name: "Green Bay Packers", abbreviation: "GB" }, homeTeam: { name: "Tampa Bay Buccaneers", abbreviation: "TB" } });
  assert.equal(selectKioskSportsEvent([fp3, packers], now)?.event.id, "packers-current");
});

test("Packers and Angels receive favorite priority when timing is equal", () => {
  const selected = selectKioskSportsEvent([
    event("other-nfl", "nfl", "2026-10-02T14:00:00Z", { homeTeam: { name: "Chicago Bears" }, awayTeam: { name: "Detroit Lions" } }),
    event("packers", "nfl", "2026-10-02T14:00:00Z", { homeTeam: { name: "Green Bay Packers" }, awayTeam: { name: "Tampa Bay Buccaneers" } }),
  ], now);
  assert.equal(selected?.event.id, "packers");
});

test("MLB postseason remains eligible when the Angels are inactive", () => {
  const selected = selectKioskSportsEvent([event("alds", "mlb", "2026-10-02T14:00:00Z", { title: "ALDS Game 2: Yankees vs Orioles", homeTeam: { name: "New York Yankees", abbreviation: "NYY" }, awayTeam: { name: "Baltimore Orioles" }, metadata: { seasonType: "Postseason", competition: "ALDS" } })], now);
  assert.equal(selected?.eventType, "POSTSEASON");
  assert.equal(selected?.backgroundKey, "mlb-yankee-stadium");
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
  assert.equal(normalizeKioskSportsEvent(event("mlb", "mlb", "2026-10-03T12:00:00Z", { homeTeam: { name: "Los Angeles Angels" }, awayTeam: { name: "Seattle Mariners" } }))?.backgroundKey, "mlb-angel-stadium");
  assert.equal(normalizeKioskSportsEvent(event("usu", "college-football", "2026-10-03T12:00:00Z", { homeTeam: { id: "328", name: "Utah State Aggies", abbreviation: "USU" }, awayTeam: { name: "Boise State Broncos", abbreviation: "BSU" } }))?.backgroundKey, "cfb-generic");
});

test("NASCAR Las Vegas resolves to its dedicated track key and asset", () => {
  const normalized = normalizeKioskSportsEvent(event("vegas", "nascar", "2026-10-03T12:00:00Z", { venue: "Las Vegas Motor Speedway" }));
  assert.equal(normalized?.backgroundKey, "nascar-las-vegas");
  assert.equal(selectKioskSportsBackground(normalized?.backgroundKey), "/sports/tracks/nascar/las-vegas.svg");
});

test("MLB stadium mapping uses the home team, not an away favorite", () => {
  assert.equal(normalizeKioskSportsEvent(event("yankees-home", "mlb", "2026-10-03T12:00:00Z", { homeTeam: { name: "New York Yankees", abbreviation: "NYY" }, awayTeam: { name: "Los Angeles Angels" } }))?.backgroundKey, "mlb-yankee-stadium");
  assert.equal(normalizeKioskSportsEvent(event("yankees-away", "mlb", "2026-10-03T12:00:00Z", { title: "Yankees at Orioles", homeTeam: { name: "Baltimore Orioles" }, awayTeam: { name: "New York Yankees", abbreviation: "NYY" } }))?.backgroundKey, "mlb-oriole-park-at-camden-yards");
});

test("unknown venues use the sport-specific generic fallback", () => {
  assert.equal(selectKioskSportsBackground("nfl-unknown"), "/dashboard/sports/stadium.webp");
  assert.equal(selectKioskSportsBackground("mlb-unknown"), "/dashboard/sports/baseball.webp");
  assert.equal(selectKioskSportsBackground("f1-unknown"), "/dashboard/sports/motorsport.webp");
  assert.equal(selectKioskSportsBackground("nascar-unknown"), "/dashboard/sports/motorsport.webp");
  assert.equal(selectKioskSportsBackground("cfb-generic"), "/dashboard/sports/stadium.webp");
});

test("F1 circuit aliases resolve to the imported venue backgrounds", () => {
  const cases = [
    ["Sepang International Circuit", "Malaysia", "f1-malaysia", "/kiosk/scenes/sports/f1/f1-malaysia.webp"],
    ["Autodromo Nazionale Monza", "Italy", "f1-monza", "/kiosk/scenes/sports/f1/f1-monza.webp"],
    ["Circuit of the Americas", "United States", "f1-austin", "/kiosk/scenes/sports/f1/f1-austin.webp"],
    ["COTA", "United States", "f1-austin", "/kiosk/scenes/sports/f1/f1-austin.webp"],
    ["Interlagos", "Brazil", "f1-brazil", "/kiosk/scenes/sports/f1/f1-brazil.webp"],
    ["Lusail International Circuit", "Qatar", "f1-qatar", "/kiosk/scenes/sports/f1/f1-qatar.webp"],
    ["Yas Marina Circuit", "United Arab Emirates", "f1-abu-dhabi", "/kiosk/scenes/sports/f1/f1-abu-dhabi.webp"],
  ] as const;
  for (const [venue, country, key, asset] of cases) {
    const normalized = normalizeKioskSportsEvent(event(key, "f1", "2026-10-03T12:00:00Z", { venue, metadata: { country } }));
    assert.equal(normalized?.backgroundKey, key);
    assert.equal(selectKioskSportsBackground(normalized?.backgroundKey), asset);
  }
});

test("F1 session types preserve the same venue background", () => {
  for (const session of ["Practice 1", "Practice 2", "Practice 3", "Qualifying", "Sprint", "Race"]) {
    const normalized = normalizeKioskSportsEvent(event(`malaysia-${session}`, "f1", "2026-10-03T12:00:00Z", { title: `Malaysian Grand Prix · ${session}`, venue: "Sepang International Circuit", metadata: { country: "Malaysia", sessionType: session } }));
    assert.equal(normalized?.backgroundKey, "f1-malaysia");
    assert.equal(selectKioskSportsBackground(normalized?.backgroundKey), "/kiosk/scenes/sports/f1/f1-malaysia.webp");
  }
});

test("F1 sessions use Apple TV as their kiosk broadcaster", () => {
  assert.equal(normalizeKioskSportsEvent(event("f1-broadcast", "f1", "2026-10-03T12:00:00Z", { title: "Malaysia Grand Prix · Qualifying", metadata: { sessionType: "Qualifying" } }))?.broadcaster, "Apple TV");
});

test("unknown F1 venues use the generic motorsport fallback", () => {
  const normalized = normalizeKioskSportsEvent(event("unknown-f1", "f1", "2026-10-03T12:00:00Z", { venue: "Unknown International Circuit", metadata: { country: "Unknown" } }));
  assert.equal(normalized?.backgroundKey, "f1-generic");
  assert.equal(selectKioskSportsBackground(normalized?.backgroundKey), "/dashboard/sports/motorsport.webp");
});
