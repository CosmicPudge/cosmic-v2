import assert from "node:assert/strict";
import test from "node:test";

import type { CosmicNavigationResponse } from "../src/glasses/data/navigationClient.ts";
import { buildNavigationPresentation } from "../src/glasses/hud/navigationPresentation.ts";
import {
  getPhoneNavigationVisual,
  PHONE_FIXTURE_BEARING_PRESETS,
} from "../src/phone/navigationVisual.ts";

function response(targetBearing: number, distanceMeters = 500): CosmicNavigationResponse {
  return {
    navigation: {
      destination: "Home",
      etaMinutes: 4,
      distanceMiles: 1,
      traffic: "light",
      arrivalTime: null,
      nextManeuver: {
        instruction: "Turn",
        type: "turn",
        modifier: "right",
        streetName: "Main Street",
        distanceMeters,
        targetBearing,
      },
    },
  };
}

test("forward navigation stays centered", () => {
  const visual = getPhoneNavigationVisual(buildNavigationPresentation(response(0), 0));
  assert.equal(visual.translateX, 0);
  assert.equal(visual.yawDegrees, 0);
});

test("positive and negative relative bearings move and rotate opposite directions", () => {
  const right = getPhoneNavigationVisual(buildNavigationPresentation(response(45), 0));
  const left = getPhoneNavigationVisual(buildNavigationPresentation(response(315), 0));
  assert.ok(right.translateX > 0 && right.yawDegrees > 0);
  assert.ok(left.translateX < 0 && left.yawDegrees < 0);
  assert.ok(Math.abs(right.translateX) >= 100);
});

test("ninety degrees reaches a strong side position", () => {
  const visual = getPhoneNavigationVisual(buildNavigationPresentation(response(90), 0));
  assert.equal(visual.translateX, 210);
  assert.ok(visual.yawDegrees > 50);
});

test("behind navigation uses a distinct state without flipping upside down", () => {
  const visual = getPhoneNavigationVisual(buildNavigationPresentation(response(180), 0));
  assert.equal(visual.behind, true);
  assert.equal(visual.rollDegrees, 0);
  assert.equal(visual.yawDegrees, 68);
});

test("urgency and NOW state increase visual scale", () => {
  const far = getPhoneNavigationVisual(buildNavigationPresentation(response(0, 700), 0));
  const near = getPhoneNavigationVisual(buildNavigationPresentation(response(0, 100), 0));
  const now = getPhoneNavigationVisual(buildNavigationPresentation(response(0, 10), 0));
  assert.ok(far.scale < near.scale);
  assert.ok(near.scale < now.scale);
});

test("fixture presets cover the intended directional states", () => {
  assert.deepEqual(
    PHONE_FIXTURE_BEARING_PRESETS.map(({ label, heading, target }) => ({ label, heading, target })),
    [
      { label: "STRAIGHT", heading: 0, target: 0 },
      { label: "SLIGHT LEFT", heading: 0, target: 315 },
      { label: "LEFT", heading: 0, target: 270 },
      { label: "HARD LEFT", heading: 0, target: 225 },
      { label: "SLIGHT RIGHT", heading: 0, target: 45 },
      { label: "RIGHT", heading: 0, target: 90 },
      { label: "HARD RIGHT", heading: 0, target: 135 },
      { label: "BEHIND", heading: 0, target: 180 },
    ],
  );
});

test("requested heading and target combinations map through the shared model", () => {
  const cases = [
    { heading: 0, target: 0, sign: 0 },
    { heading: 0, target: 45, sign: 1 },
    { heading: 0, target: 90, sign: 1 },
    { heading: 0, target: 270, sign: -1 },
    { heading: 350, target: 10, sign: 1 },
    { heading: 10, target: 350, sign: -1 },
  ];
  for (const item of cases) {
    const presentation = buildNavigationPresentation(response(item.target), item.heading);
    const visual = getPhoneNavigationVisual(presentation);
    assert.equal(Math.sign(presentation.relativeBearing ?? 0), item.sign);
    assert.equal(Math.sign(visual.translateX), item.sign);
  }
});
