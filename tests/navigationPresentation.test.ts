import assert from "node:assert/strict";
import test from "node:test";

import type { CosmicNavigationResponse } from "../src/glasses/data/navigationClient.ts";
import {
  buildNavigationPresentation,
  formatNavigationContext,
  normalizeHeading,
  relativeBearing,
} from "../src/glasses/hud/navigationPresentation.ts";

function response(overrides: Partial<NonNullable<CosmicNavigationResponse["navigation"]>["nextManeuver"]> = {}): CosmicNavigationResponse {
  return {
    navigation: {
      destination: "Home",
      etaMinutes: 4,
      distanceMiles: 1,
      traffic: "light",
      arrivalTime: null,
      nextManeuver: {
        instruction: "Turn right",
        type: "turn",
        modifier: "right",
        streetName: "Main Street",
        distanceMeters: 100,
        ...overrides,
      },
    },
  };
}

test("normalizes headings and relative bearings across north", () => {
  assert.equal(normalizeHeading(-10), 350);
  assert.equal(normalizeHeading(370), 10);
  assert.equal(relativeBearing(10, 350), 20);
  assert.equal(relativeBearing(350, 10), -20);
  assert.equal(relativeBearing(180, 0), 180);
  assert.equal(relativeBearing(0, 180), -180);
  assert.equal(relativeBearing(null, 10), null);
});

test("uses target bearing when real heading data is available", () => {
  const presentation = buildNavigationPresentation(response({
    targetBearing: 30,
    modifier: "right",
  }), 350);
  assert.equal(presentation.relativeBearing, 40);
  assert.equal(presentation.directionClass, "slight-right");
  assert.equal(presentation.arrow, "↗");
  assert.equal(presentation.behind, false);
});

test("marks a maneuver behind the device without inventing a new route", () => {
  const presentation = buildNavigationPresentation(response({ targetBearing: 180 }), 0);
  assert.equal(presentation.relativeBearing, 180);
  assert.equal(presentation.directionClass, "uturn");
  assert.equal(presentation.behind, true);
  assert.equal(presentation.arrow, null);
});

test("keeps modifier fallback when target bearing is unavailable", () => {
  const presentation = buildNavigationPresentation(response({ targetBearing: null, modifier: "left" }), null);
  assert.equal(presentation.relativeBearing, null);
  assert.equal(presentation.directionClass, "left");
  assert.equal(presentation.arrow, "←");
});

test("exposes context only for an active, unpassed maneuver", () => {
  assert.equal(formatNavigationContext(buildNavigationPresentation(response({ distanceMeters: 801 }))), "");
  assert.equal(buildNavigationPresentation(response({ distanceMeters: -1 })).passed, true);
  assert.equal(formatNavigationContext(buildNavigationPresentation({ navigation: null })), "");
});

test("keeps compact context formatting bounded", () => {
  const presentation = buildNavigationPresentation(response({ modifier: "sharp right", distanceMeters: 500 }));
  assert.ok(formatNavigationContext(presentation).length <= 25);
});
