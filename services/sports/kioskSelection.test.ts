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

test("upcoming automatic kiosk events are ordered by actual start time", () => {
  const selected = selectKioskSportsEvent([event("later-game", "college-football", "2026-10-05T12:00:00Z"), event("first-game", "nfl", "2026-10-02T14:00:00Z")], now);
  assert.equal(selected?.event.id, "first-game");
});

test("Utah State before tomorrow's Packers game is the next automatic event", () => {
  const selected = selectKioskSportsEvent([
    event("usu", "college-football", "2026-10-03T23:30:00Z", { homeTeam: { id: "328", name: "Utah State Aggies" }, awayTeam: { id: "68", name: "Boise State Broncos" } }),
    event("packers", "nfl", "2026-10-04T17:00:00Z", { awayTeam: { id: "9", name: "Green Bay Packers" }, homeTeam: { id: "27", name: "Tampa Bay Buccaneers" } }),
  ], new Date("2026-10-03T23:28:00Z"));
  assert.equal(selected?.event.id, "usu");
});

test("scheduled CFB remains upcoming just before kickoff and starting during grace", () => {
  const kickoff = new Date("2026-10-03T23:30:00Z");
  const game = event("usu", "college-football", kickoff.toISOString(), { homeTeam: { id: "328", name: "Utah State Aggies" }, awayTeam: { id: "68", name: "Boise State Broncos" } });
  const before = normalizeKioskSportsEvent(game, new Date("2026-10-03T23:28:00Z"));
  const sevenMinutesAfter = normalizeKioskSportsEvent(game, new Date("2026-10-03T23:37:00Z"));
  const thirtyMinutesAfter = normalizeKioskSportsEvent(game, new Date("2026-10-04T00:00:00Z"));
  assert.equal(before?.starting, false);
  assert.equal(before?.displayState, "pregame");
  assert.equal(sevenMinutesAfter?.starting, true);
  assert.equal(sevenMinutesAfter?.live, false);
  assert.equal(sevenMinutesAfter?.displayState, "starting");
  assert.equal(thirtyMinutesAfter?.starting, true);
  assert.equal(selectKioskSportsEvent([game], new Date("2026-10-03T23:37:00Z"))?.event.id, "usu");
});

test("scheduled CFB beyond kickoff grace is released", () => {
  const game = event("usu-expired", "college-football", "2026-10-03T23:30:00Z", { homeTeam: { id: "328", name: "Utah State Aggies" }, awayTeam: { id: "68", name: "Boise State Broncos" } });
  const now = new Date("2026-10-04T00:16:00Z");
  assert.equal(normalizeKioskSportsEvent(game, now)?.starting, false);
  assert.equal(selectKioskSportsEvent([game], now), undefined);
  assert.equal(describeKioskSportsSelection([game], now).candidates[0]?.exclusionReason, "start-before-now");
});

test("pregame event outranks a later future football event and delayed stays selected", () => {
  const pregameNow = new Date("2026-10-03T23:00:00Z");
  const pregame = event("usu-pregame", "college-football", "2026-10-03T23:20:00Z", { homeTeam: { id: "328", name: "Utah State Aggies" } });
  const later = event("packers-later", "nfl", "2026-10-04T17:00:00Z", { awayTeam: { id: "9", name: "Green Bay Packers" } });
  assert.equal(normalizeKioskSportsEvent(pregame, pregameNow)?.displayState, "pregame");
  assert.equal(selectKioskSportsEvent([later, pregame], pregameNow)?.event.id, "usu-pregame");
  const delayed = { ...pregame, status: "delayed" as const, statusDetail: "Weather delay" };
  assert.equal(normalizeKioskSportsEvent(delayed, pregameNow)?.displayState, "delayed");
  assert.equal(selectKioskSportsEvent([later, delayed], pregameNow)?.event.id, "usu-pregame");
});

test("final football event is held briefly, then releases", () => {
  const finalAt = new Date("2026-10-03T23:00:00Z");
  const finished = event("usu-final", "college-football", finalAt.toISOString(), { status: "final", metadata: { finalizedAt: finalAt.toISOString() } });
  const next = event("packers-next", "nfl", "2026-10-04T17:00:00Z", { awayTeam: { id: "9", name: "Green Bay Packers" } });
  assert.equal(selectKioskSportsEvent([finished, next], new Date("2026-10-03T23:00:14Z"))?.event.id, "usu-final");
  assert.equal(selectKioskSportsEvent([finished, next], new Date("2026-10-03T23:00:16Z"))?.event.id, "packers-next");
});

test("NFL receives the same kickoff grace and delayed games are not inferred live", () => {
  const nfl = event("packers", "nfl", "2026-10-04T17:00:00Z", { homeTeam: { id: "27", name: "Tampa Bay Buccaneers" }, awayTeam: { id: "9", name: "Green Bay Packers" } });
  const delayed = { ...nfl, status: "delayed" as const };
  assert.equal(normalizeKioskSportsEvent(nfl, new Date("2026-10-04T17:07:00Z"))?.starting, true);
  assert.equal(normalizeKioskSportsEvent(delayed, new Date("2026-10-04T17:07:00Z"))?.live, false);
  assert.equal(normalizeKioskSportsEvent(delayed, new Date("2026-10-04T17:07:00Z"))?.starting, false);
});

test("live CFB beats upcoming NFL and a final CFB releases to NFL", () => {
  const now = new Date("2026-10-03T23:00:00Z");
  const cfb = event("usu-live", "college-football", "2026-10-03T22:00:00Z", { status: "live", homeTeam: { id: "328", name: "Utah State Aggies" } });
  const nfl = event("packers", "nfl", "2026-10-04T17:00:00Z", { awayTeam: { id: "9", name: "Green Bay Packers" }, homeTeam: { id: "27", name: "Tampa Bay Buccaneers" } });
  assert.equal(selectKioskSportsEvent([cfb, nfl], now)?.event.id, "usu-live");
  assert.equal(selectKioskSportsEvent([{ ...cfb, status: "final" }, nfl], now)?.event.id, "packers");
});

test("automatic kiosk selection ignores earlier F1 sessions", () => {
  const eveningMdt = new Date("2026-10-03T04:00:00Z");
  const fp3 = event("fp3", "f1", "2026-10-03T04:30:00Z", { title: "Malaysian Grand Prix · Practice 3", venue: "Sepang International Circuit", metadata: { sessionType: "Practice 3", country: "Malaysia", circuit: "Sepang International Circuit" } });
  const packers = event("packers-later", "nfl", "2026-10-04T19:00:00Z", { title: "Green Bay Packers at Tampa Bay Buccaneers", awayTeam: { name: "Green Bay Packers", abbreviation: "GB" }, homeTeam: { name: "Tampa Bay Buccaneers", abbreviation: "TB" } });
  const selected = selectKioskSportsEvent([fp3, packers], eveningMdt);
  assert.equal(selected?.event.id, "packers-later");
  const diagnostics = describeKioskSportsSelection([fp3, packers], eveningMdt, "America/Denver");
  assert.equal(diagnostics.candidates.find((candidate) => candidate.title.includes("Practice 3"))?.eligible, false);
  assert.equal(diagnostics.candidates.find((candidate) => candidate.title.includes("Practice 3"))?.exclusionReason, "sport-not-eligible-for-automatic-kiosk-screen");
  assert.equal(diagnostics.candidates.find((candidate) => candidate.title.includes("Practice 3"))?.parsedUtcStart, "2026-10-03T04:30:00.000Z");
});

test("completed and upcoming F1 sessions do not become automatic kiosk events", () => {
  const now = new Date("2026-10-03T06:00:00Z");
  const fp3 = event("fp3-complete", "f1", "2026-10-03T04:30:00Z", { title: "Malaysian Grand Prix · Practice 3", status: "final", metadata: { sessionType: "Practice 3", country: "Malaysia" } });
  const qualifying = event("qualifying", "f1", "2026-10-03T08:00:00Z", { title: "Malaysian Grand Prix · Qualifying", metadata: { sessionType: "Qualifying", country: "Malaysia" } });
  assert.equal(selectKioskSportsEvent([fp3, qualifying], now), undefined);
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

test("only NFL and CFB can be automatic kiosk sports", () => {
  const liveEvents = [
    event("mlb-live", "mlb", "2026-10-02T12:00:00Z", { status: "live" }),
    event("f1-live", "f1", "2026-10-02T12:00:00Z", { status: "live" }),
    event("nascar-live", "nascar", "2026-10-02T12:00:00Z", { status: "live" }),
    event("cfb-live", "college-football", "2026-10-02T12:00:00Z", { status: "live" }),
  ];
  assert.equal(selectKioskSportsEvent(liveEvents)?.event.id, "cfb-live");
  assert.equal(selectKioskSportsEvent(liveEvents.filter((item) => item.sport !== "college-football")), undefined);
});

test("followed-team automatic sports remain eligible for live pinning", () => {
  const selected = selectKioskSportsEvent([
    event("packers-live", "nfl", "2026-10-02T12:00:00Z", { status: "live", homeTeam: { id: "9", name: "Green Bay Packers" } }),
    event("usu-live", "college-football", "2026-10-02T12:00:00Z", { status: "live", homeTeam: { id: "328", name: "Utah State Aggies" } }),
  ], now);
  assert.equal(["packers-live", "usu-live"].includes(selected?.event.id ?? ""), true);
});

test("MLB postseason remains eligible when the Angels are inactive", () => {
  const postseason = normalizeKioskSportsEvent(event("alds", "mlb", "2026-10-02T14:00:00Z", { title: "ALDS Game 2: Yankees vs Orioles", homeTeam: { name: "New York Yankees", abbreviation: "NYY" }, awayTeam: { name: "Baltimore Orioles" }, metadata: { seasonType: "Postseason", competition: "ALDS" } }));
  assert.equal(postseason?.eventType, "POSTSEASON");
  assert.equal(postseason?.backgroundKey, "mlb-yankee-stadium");
  assert.equal(selectKioskSportsEvent([postseason!.event], now), undefined);
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
  assert.equal(normalizeKioskSportsEvent(event("usu", "college-football", "2026-10-03T12:00:00Z", { homeTeam: { id: "328", name: "Utah State Aggies", abbreviation: "USU" }, awayTeam: { name: "Boise State Broncos", abbreviation: "BSU" } }))?.backgroundKey, "cfb-maverik-stadium");
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
