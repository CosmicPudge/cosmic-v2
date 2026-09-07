import assert from "node:assert/strict";
import test from "node:test";

import type { CosmicNavigationResponse } from "../src/glasses/data/navigationClient.ts";
import { buildNavigationPresentation } from "../src/glasses/hud/navigationPresentation.ts";
import { formatPhoneNavigationDiagnostics } from "../src/phone/navigationDiagnostics.ts";

function response(targetBearing: number | null = 10, distanceMeters = 121.92): CosmicNavigationResponse {
  return {
    navigation: {
      destination: "Home",
      etaMinutes: 2,
      distanceMiles: 0.2,
      traffic: "light",
      arrivalTime: null,
      nextManeuver: {
        instruction: "Turn right",
        type: "turn",
        modifier: "right",
        streetName: "Main Street",
        distanceMeters,
        targetBearing,
      },
    },
  };
}

test("diagnostics display shared target, relative, and distance values", () => {
  const presentation = buildNavigationPresentation(response(), 350);
  assert.deepEqual(
    formatPhoneNavigationDiagnostics("real", 350, presentation),
    {
      mode: "real",
      heading: "350°",
      target: "10°",
      relative: "+20°",
      distance: "400 ft",
    },
  );
});

test("diagnostics use UNAVAILABLE for missing heading, target, relative, and distance", () => {
  const noHeading = buildNavigationPresentation(response(), null);
  const noNavigation = buildNavigationPresentation({ navigation: null }, null);
  assert.deepEqual(
    formatPhoneNavigationDiagnostics("real", null, noHeading),
    {
      mode: "real",
      heading: "UNAVAILABLE",
      target: "10°",
      relative: "UNAVAILABLE",
      distance: "400 ft",
    },
  );
  assert.deepEqual(
    formatPhoneNavigationDiagnostics("real", null, noNavigation),
    {
      mode: "real",
      heading: "UNAVAILABLE",
      target: "UNAVAILABLE",
      relative: "UNAVAILABLE",
      distance: "UNAVAILABLE",
    },
  );
});

test("REAL diagnostics do not introduce fixture heading values", () => {
  const presentation = buildNavigationPresentation(response(350), null);
  assert.equal(
    formatPhoneNavigationDiagnostics("real", null, presentation).relative,
    "UNAVAILABLE",
  );
});
