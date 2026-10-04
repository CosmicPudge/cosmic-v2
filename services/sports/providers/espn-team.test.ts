import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEspnFootballEvents, usuFootballProvider } from "./espn-team";

const payload = (status: string, scores = [14, 21]) => ({ events: [{ id: "401-cfb-1", date: "2026-10-03T19:00:00Z", seasonType: { name: "Regular Season" }, competitions: [{ status: { type: { state: status === "live" ? "in" : status === "final" ? "post" : "pre", detail: status === "live" ? "3rd Quarter" : status === "final" ? "Final" : "Scheduled" } }, ...(status === "live" ? { situation: { period: 3, displayClock: "04:22", possession: "328", down: 2, distance: 7, downDistanceText: "2nd & 7", possessionText: "Utah State ball" } } : {}), venue: { fullName: "Maverik Stadium" }, competitors: [{ homeAway: "away", score: String(scores[0]), team: { id: "68", displayName: "Boise State Broncos", abbreviation: "BSU" } }, { homeAway: "home", score: String(scores[1]), team: { id: "328", displayName: "Utah State Aggies", abbreviation: "USU" } }] }] }] });

test("ESPN CFB normalization preserves stable event identity and game state", () => {
  const events = normalizeEspnFootballEvents(payload("live"), "college-football", "espn-college-football-scoreboard");
  assert.equal(events[0]?.id, "espn:college-football:401-cfb-1");
  assert.equal(events[0]?.sport, "college-football");
  assert.equal(events[0]?.status, "live");
  assert.equal(events[0]?.homeTeam?.name, "Utah State Aggies");
  assert.equal(events[0]?.homeTeam?.score, 21);
  assert.equal(events[0]?.metadata?.gamePk, "401-cfb-1");
  assert.equal(events[0]?.metadata?.period, 3);
  assert.equal(events[0]?.metadata?.clock, "04:22");
  assert.equal(events[0]?.metadata?.possessionTeamId, "328");
  assert.equal(events[0]?.metadata?.downDistanceText, "2nd & 7");
  assert.equal(events[0]?.venue, "Maverik Stadium");
});

test("ESPN CFB normalization handles scheduled and final games", () => {
  assert.equal(normalizeEspnFootballEvents(payload("scheduled"), "college-football", "espn-cfb")[0]?.status, "scheduled");
  assert.equal(normalizeEspnFootballEvents(payload("final"), "college-football", "espn-cfb")[0]?.status, "final");
});

test("Utah State fallback provider targets the Utah State ESPN team", () => {
  assert.equal(usuFootballProvider.id, "college-football-usu-espn-fallback");
});
