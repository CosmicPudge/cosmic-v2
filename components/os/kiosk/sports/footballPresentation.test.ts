import test from "node:test";
import assert from "node:assert/strict";
import { createFootballPresentation } from "./footballPresentation";
import type { SportsEvent } from "@/core/contracts/Sports";

const event = (sport: "nfl" | "college-football"): SportsEvent => ({
  id: `test-${sport}`, sport, title: sport === "nfl" ? "Packers at Buccaneers" : "Utah State at Boise State", start: new Date(), status: "live", source: "test",
  awayTeam: { id: sport === "nfl" ? "gb" : "68", name: sport === "nfl" ? "Green Bay Packers" : "Boise State Broncos", abbreviation: sport === "nfl" ? "GB" : "BOIS", score: 7 },
  homeTeam: { id: sport === "nfl" ? "tb" : "328", name: sport === "nfl" ? "Tampa Bay Buccaneers" : "Utah State Aggies", abbreviation: sport === "nfl" ? "TB" : "USU", score: 10 },
});

test("NFL and CFB share the same football presentation contract", () => {
  const view = createFootballPresentation(event("college-football"), {
    status: "live", period: 3, clock: "08:42", away: { team: { id: "68", name: "Boise State Broncos", abbreviation: "BOIS" }, score: 7 }, home: { team: { id: "328", name: "Utah State Aggies", abbreviation: "USU" }, score: 10 },
    situation: { quarter: 3, clock: "08:42", possessionTeamId: "328", downDistanceText: "2nd & 7 at USU 35", possessionText: "USU 35" },
    normalizedPlays: [{ description: "Pass complete for 8 yards", shortDescription: "Complete", type: "pass" }],
  });
  assert.equal(view.sportLabel, "CFB"); assert.equal(view.statusLabel, "LIVE"); assert.equal(view.home.abbreviation, "USU"); assert.equal(view.away.abbreviation, "BSU"); assert.equal(view.home.possession, true); assert.equal(view.latestPlay?.shortDescription, "Complete");
});

test("football presentation exposes drive, penalty, and review attention data", () => {
  const view = createFootballPresentation(event("nfl"), {
    sport: "nfl", eventId: "x", generatedAt: new Date().toISOString(), stale: false, sources: [],
    away: { team: { id: "gb", name: "Green Bay Packers", abbreviation: "GB" }, score: 7, timeoutsRemaining: 2 }, home: { team: { id: "tb", name: "Tampa Bay Buccaneers", abbreviation: "TB" }, score: 10, timeoutsRemaining: 3 }, situation: { quarter: 2, clock: "04:20", downDistanceText: "3rd & 4", possessionTeamId: "gb" }, currentDrive: { description: "Green Bay drive · 6 plays, 42 yards" }, latestPlay: { description: "Holding, offense", penalty: true }, penalty: { text: "Holding, offense", yards: 10 }, review: { text: "Challenge under review", active: true },
  });
  assert.equal(view.driveLabel, "Green Bay drive · 6 plays, 42 yards"); assert.equal(view.penaltyText, "Holding, offense · 10-yard penalty"); assert.equal(view.reviewText, "Challenge under review"); assert.equal(view.away.timeouts, 2);
});

test("attention state priority is review over flag and preserves possession color", () => {
  const view = createFootballPresentation(event("college-football"), {
    status: "live", period: 2, clock: "01:12", away: { team: { id: "68", name: "Boise State Broncos", abbreviation: "BSU" }, score: 14 }, home: { team: { id: "328", name: "Utah State Aggies", abbreviation: "USU" }, score: 17, possession: true },
    situation: { quarter: 2, clock: "01:12", possessionTeamId: "328", possessionText: "USU 8", downDistanceText: "1st & Goal", redZone: true }, normalizedPlays: [{ description: "Holding, offense", type: "penalty", penalty: true }],
    penalty: { text: "Holding, offense", teamId: "328", yards: 10 }, review: { text: "Challenge under review", kind: "challenge", teamName: "Boise State", active: true },
  });
  assert.equal(view.attention, "challenge"); assert.equal(view.attentionLabel, "COACH'S CHALLENGE"); assert.equal(view.attentionTeam, "Boise State"); assert.equal(view.home.possession, true); assert.equal(view.home.color, "#0f2439");
});

test("zero scores remain numeric and halftime is not rendered as a running clock", () => {
  const view = createFootballPresentation(event("nfl"), {
    sport: "nfl", statusText: "Halftime", state: "halftime", eventId: "x", generatedAt: new Date().toISOString(), stale: false, sources: [], period: 2, clock: "00:00", away: { team: { name: "Green Bay Packers", abbreviation: "GB" }, score: 0 }, home: { team: { name: "Tampa Bay Buccaneers", abbreviation: "TB" }, score: 14 }, situation: { quarter: 2, clock: "00:00" },
  });
  assert.equal(view.away.score, 0); assert.equal(view.home.score, 14); assert.equal(view.statusLabel, "HALFTIME"); assert.equal(view.clock, undefined);
});
