import assert from "node:assert/strict";
import test from "node:test";

import type {
  CosmicNavigationResponse,
} from "../src/glasses/data/navigationClient.ts";
import {
  formatNavigationDistance,
  formatUrgentNavigationContext,
  getNavigationArrow,
  getNavigationManeuverLabel,
  shouldUseLargeNavigationArrow,
  NAVIGATION_CONTEXT_DISTANCE_METERS,
} from "../src/glasses/hud/navigationContext.ts";

function response(
  distanceMeters: number,
  overrides: Partial<NonNullable<CosmicNavigationResponse["navigation"]>["nextManeuver"]> = {},
): CosmicNavigationResponse {
  return {
    navigation: {
      destination: "Home",
      etaMinutes: 4,
      distanceMiles: 1.2,
      traffic: "light",
      arrivalTime: null,
      nextManeuver: {
        instruction: "Turn right",
        type: "turn",
        modifier: "right",
        streetName: "Main Street",
        distanceMeters,
        ...overrides,
      },
    },
  };
}

test("shows urgent navigation at and below the 800 meter threshold", () => {
  assert.equal(
    formatUrgentNavigationContext(response(NAVIGATION_CONTEXT_DISTANCE_METERS)),
    "TURN RIGHT • 2600 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(350 / 3.28084)),
    "TURN RIGHT • 350 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(130)),
    "TURN RIGHT • 430 ft",
  );
});

test("does not show navigation beyond the urgent threshold or without a maneuver", () => {
  assert.equal(formatUrgentNavigationContext(response(801)), "");
  assert.equal(
    formatUrgentNavigationContext({
      navigation: {
        ...response(350).navigation!,
        nextManeuver: null,
      },
    }),
    "",
  );
  assert.equal(formatUrgentNavigationContext({ navigation: null }), "");
});

test("formats supported maneuver labels and truncates compactly", () => {
  assert.equal(
    formatUrgentNavigationContext(response(500, { modifier: "left" })),
    "TURN LEFT • 1650 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(500, { modifier: "straight" })),
    "CONTINUE • 1650 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(500, { modifier: "uturn" })),
    "U-TURN • 1650 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(500, { type: "exit" })),
    "EXIT • 1650 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(500, { type: "arrive" })),
    "ARRIVE • 1650 ft",
  );
  assert.equal(
    formatUrgentNavigationContext(response(500, { type: "unknown", modifier: null })),
    "NAVIGATION • 1650 ft",
  );
  assert.ok(formatUrgentNavigationContext(response(500, {
    instruction: "A very long navigation instruction that must not be used",
  })).length <= 25);
});

test("maps real maneuver modifiers to conservative large-card arrows", () => {
  assert.equal(getNavigationArrow("continue", "straight"), "↑");
  assert.equal(getNavigationArrow("turn", "slight right"), "↗");
  assert.equal(getNavigationArrow("turn", "right"), "→");
  assert.equal(getNavigationArrow("turn", "sharp right"), "↘");
  assert.equal(getNavigationArrow("turn", "slight left"), "↖");
  assert.equal(getNavigationArrow("turn", "left"), "←");
  assert.equal(getNavigationArrow("turn", "sharp left"), "↙");
  assert.equal(getNavigationArrow("arrive", null), "◎");
  assert.equal(getNavigationArrow("turn", "uturn"), null);
  assert.equal(getNavigationArrow("roundabout", null), null);
  assert.equal(getNavigationArrow("unknown", null), null);
  assert.equal(getNavigationManeuverLabel("turn", "uturn"), "U-TURN");
});

test("activates large arrows at 250 meters and keeps far maneuvers textual", () => {
  assert.equal(shouldUseLargeNavigationArrow(250, "turn", "right"), true);
  assert.equal(shouldUseLargeNavigationArrow(60, "turn", "right"), true);
  assert.equal(shouldUseLargeNavigationArrow(251, "turn", "right"), false);
  assert.equal(shouldUseLargeNavigationArrow(250, "turn", "uturn"), false);
});

test("formats distance using the existing feet and miles rules", () => {
  assert.equal(formatNavigationDistance(0), "NOW");
  assert.equal(formatNavigationDistance(100), "330 ft");
  assert.equal(formatNavigationDistance(1609.344), "1.0 mi");
  assert.equal(formatNavigationDistance(-1), "");
  assert.equal(formatNavigationDistance(Number.NaN), "");
});
