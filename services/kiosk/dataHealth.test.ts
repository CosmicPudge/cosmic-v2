import assert from "node:assert/strict";
import test from "node:test";
import { classifyKioskDataHealth } from "./dataHealth";

test("valid empty calendar and school payloads are connected", () => {
  assert.deepEqual(classifyKioskDataHealth({ weather: { temp: 68 }, calendar: { connected: true }, school: { connected: true } }), { weather: true, calendar: true, school: true });
});

test("partial aggregate health is classified per service", () => {
  assert.deepEqual(classifyKioskDataHealth({ weather: { temp: 68 }, calendar: { connected: false }, school: { connected: true } }), { weather: true, calendar: false, school: true });
});

test("aggregate failure does not claim independent weather failure", () => {
  const classified = classifyKioskDataHealth({ weather: null, calendar: { connected: false }, school: { connected: false } });
  assert.equal(classified.weather, false);
  assert.equal(classified.calendar, false);
  assert.equal(classified.school, false);
});
