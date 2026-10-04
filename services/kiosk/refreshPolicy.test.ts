import assert from "node:assert/strict";
import test from "node:test";
import type { SportsSnapshot } from "@/core/contracts/Sports";
import { KIOSK_REFRESH_MS, musicBackoffMs, musicRefreshMs, sportsRefreshMs, sportsRefreshMode } from "./refreshPolicy";

const empty = (now: Date): SportsSnapshot => ({ live: [], upcoming: [], recent: [], featured: [], standings: {}, providerErrors: [], sources: [], lastUpdated: now });
const event = (start: Date, sport: "f1" | "college-football" = "f1", status: "scheduled" | "delayed" = "scheduled") => ({ id: "event", sport, title: "Event", start, status, source: "test" });

test("music uses 500ms playing, slower paused, and idle intervals", () => {
  assert.equal(musicRefreshMs(true, false), KIOSK_REFRESH_MS.musicPaused);
  assert.equal(musicRefreshMs(false, true), KIOSK_REFRESH_MS.musicActive);
  assert.equal(musicRefreshMs(false, false), KIOSK_REFRESH_MS.musicIdle);
  assert.equal(KIOSK_REFRESH_MS.musicActive, 500);
  assert.equal(musicBackoffMs(1), 2_000);
  assert.equal(musicBackoffMs(3), 8_000);
  assert.equal(musicBackoffMs(1, 90_000), 60_000);
});

test("sports refreshes live events within ten seconds and near-start events within thirty", () => {
  const now = new Date("2026-10-03T04:00:00Z");
  assert.equal(sportsRefreshMs({ ...empty(now), live: [event(now)] }, now), KIOSK_REFRESH_MS.sportsLive);
  const near = { ...empty(now), upcoming: [event(new Date(now.getTime() + 30 * 60_000))] };
  assert.equal(sportsRefreshMode(near, now), "near-live");
  assert.equal(sportsRefreshMs(near, now), KIOSK_REFRESH_MS.sportsNearLive);
  const kickoffGrace = { ...empty(now), upcoming: [event(new Date(now.getTime() - 10 * 60_000), "college-football")] };
  assert.equal(sportsRefreshMode(kickoffGrace, now), "near-live");
  assert.equal(sportsRefreshMs(kickoffGrace, now), KIOSK_REFRESH_MS.sportsNearLive);
  const delayed = { ...empty(now), upcoming: [event(new Date(now.getTime() - 10 * 60_000), "college-football", "delayed")] };
  assert.equal(sportsRefreshMode(delayed, now), "near-live");
});

test("kiosk provider intervals keep slower data off the fast presentation loop", () => {
  assert.ok(KIOSK_REFRESH_MS.weatherCurrent >= 30_000 && KIOSK_REFRESH_MS.weatherCurrent <= 60_000);
  assert.ok(KIOSK_REFRESH_MS.weatherForecast >= 5 * 60_000);
  assert.ok(KIOSK_REFRESH_MS.calendar <= 30_000);
  assert.ok(KIOSK_REFRESH_MS.school >= 60_000 && KIOSK_REFRESH_MS.school <= 120_000);
});
