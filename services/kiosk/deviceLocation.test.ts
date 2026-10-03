import test from "node:test";
import assert from "node:assert/strict";
import { hasMeaningfulDeviceLocationMove, resolveDeviceLocation } from "./deviceLocation";

const fallback = { latitude: 41.73698, longitude: -111.83384, resolvedAt: "2026-10-03T00:00:00.000Z" };

test("current location wins over last-known and fallback", () => {
  const value = resolveDeviceLocation({ latitude: 40, longitude: -111, resolvedAt: "2026-10-03T00:00:00.000Z" }, fallback, fallback, Date.parse("2026-10-03T01:00:00.000Z"));
  assert.equal(value.source, "current");
  assert.equal(value.latitude, 40);
});

test("denied or unavailable geolocation falls back to recent last-known", () => {
  const value = resolveDeviceLocation(null, { latitude: 40, longitude: -111, resolvedAt: "2026-10-02T23:00:00.000Z" }, fallback, Date.parse("2026-10-03T01:00:00.000Z"));
  assert.equal(value.source, "last-known");
});

test("expired last-known location falls back to configured location", () => {
  const value = resolveDeviceLocation(null, { latitude: 40, longitude: -111, resolvedAt: "2026-09-01T00:00:00.000Z" }, fallback, Date.parse("2026-10-03T01:00:00.000Z"));
  assert.equal(value.source, "fallback");
});

test("large movement is accepted while GPS jitter is ignored", () => {
  const old = { latitude: 41.73698, longitude: -111.83384 };
  assert.equal(hasMeaningfulDeviceLocationMove(old, { latitude: 41.7371, longitude: -111.8337 }), false);
  assert.equal(hasMeaningfulDeviceLocationMove(old, { latitude: 40.7608, longitude: -111.891 }), true);
});
