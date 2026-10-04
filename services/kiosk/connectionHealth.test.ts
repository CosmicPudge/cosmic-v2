import assert from "node:assert/strict";
import test from "node:test";
import { createInitialConnectionHealth, formatKioskHealthTime, reduceConnectionHealth, withStaleAges } from "./connectionHealth";

const firstFailure = "2026-10-03T14:42:17.000Z";

test("transient failures reconnect before bounded hysteresis declares an outage", () => {
  const initial = createInitialConnectionHealth().weather;
  const failed = reduceConnectionHealth(initial, { type: "failure", at: firstFailure, category: "timeout" });
  const retried = reduceConnectionHealth(failed, { type: "failure", at: "2026-10-03T14:42:47.000Z", category: "timeout" });
  const disconnected = reduceConnectionHealth(retried, { type: "failure", at: "2026-10-03T14:43:17.000Z", category: "timeout" });
  assert.equal(failed.state, "reconnecting");
  assert.equal(retried.state, "reconnecting");
  assert.equal(disconnected.lostAt, "2026-10-03T14:43:17.000Z");
  assert.equal(disconnected.lastFailureAt, "2026-10-03T14:43:17.000Z");
  assert.equal(retried.consecutiveFailures, 2);
});

test("cancelled requests are neutral", () => {
  const connected = reduceConnectionHealth(createInitialConnectionHealth().calendar, { type: "success", at: firstFailure });
  const cancelled = reduceConnectionHealth(connected, { type: "cancelled", at: "2026-10-03T14:42:47.000Z" });
  assert.equal(cancelled.state, "connected");
  assert.equal(cancelled.lastSuccessfulAt, firstFailure);
  assert.equal(cancelled.consecutiveFailures, 0);
});

test("recovery clears the active outage and a later outage receives a new timestamp", () => {
  const initial = createInitialConnectionHealth().music;
  const failed = reduceConnectionHealth(initial, { type: "failure", at: firstFailure });
  const recovered = reduceConnectionHealth(failed, { type: "success", at: "2026-10-03T15:00:00.000Z" });
  const failedAgain = reduceConnectionHealth(recovered, { type: "failure", at: "2026-10-03T16:00:00.000Z" });
  const failedAgainTwice = reduceConnectionHealth(failedAgain, { type: "failure", at: "2026-10-03T16:00:30.000Z" });
  const failedAgainThreeTimes = reduceConnectionHealth(failedAgainTwice, { type: "failure", at: "2026-10-03T16:01:00.000Z" });
  assert.equal(recovered.state, "connected");
  assert.equal(recovered.lostAt, undefined);
  assert.equal(recovered.lastSuccessfulAt, "2026-10-03T15:00:00.000Z");
  assert.equal(failedAgain.state, "reconnecting");
  assert.equal(failedAgainThreeTimes.lostAt, "2026-10-03T16:01:00.000Z");
});

test("network offline marks each service independently without changing successful timestamps", () => {
  const initial = createInitialConnectionHealth();
  const connected = reduceConnectionHealth(initial.calendar, { type: "success", at: "2026-10-03T14:00:00.000Z" });
  const offline = reduceConnectionHealth(connected, { type: "offline", at: firstFailure });
  assert.equal(offline.state, "disconnected");
  assert.equal(offline.lostAt, firstFailure);
  assert.equal(offline.lastSuccessfulAt, "2026-10-03T14:00:00.000Z");
});

test("stale age and visible timestamps use the kiosk local formatter", () => {
  const health = createInitialConnectionHealth();
  health.weather = reduceConnectionHealth(health.weather, { type: "success", at: "2026-10-03T14:00:00.000Z" });
  const withAge = withStaleAges(health, Date.parse("2026-10-03T14:05:00.000Z"));
  assert.equal(withAge.weather.staleAgeMs, 5 * 60_000);
  assert.equal(formatKioskHealthTime("2026-10-03T14:42:17.000Z", "America/Denver"), "8:42 AM");
  assert.equal(withStaleAges(health, Date.parse("2026-10-03T14:06:00.000Z")).weather.state, "stale");
});
