import assert from "node:assert/strict";
import test from "node:test";
import { isDeveloperKioskSchoolConnected } from "./schoolHealth";

test("successful Canvas-backed School data is connected", () => {
  assert.equal(isDeveloperKioskSchoolConnected({ snapshot: { sourceStatus: { canvas: "healthy" } } }), true);
});

test("successful iCal fallback is connected without Canvas credentials", () => {
  assert.equal(isDeveloperKioskSchoolConnected({ kioskSource: "kiosk-canvas-ical", snapshot: { sourceStatus: { canvas: "healthy" } } }), true);
  assert.equal(isDeveloperKioskSchoolConnected({ kioskSource: "kiosk-canvas-ical", snapshot: { sourceStatus: { canvas: "error" } } }), true);
});

test("School provider errors remain disconnected", () => {
  assert.equal(isDeveloperKioskSchoolConnected({ kioskSource: "kiosk-canvas-ical", error: "unavailable", snapshot: { sourceStatus: { canvas: "healthy" } } }), false);
  assert.equal(isDeveloperKioskSchoolConnected({ snapshot: { sourceStatus: { canvas: "error" } } }), false);
});
