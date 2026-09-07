import assert from "node:assert/strict";
import test from "node:test";

import {
  logicalStageScale,
  nextFixtureStep,
  PHONE_HUD_HEIGHT,
  PHONE_HUD_WIDTH,
} from "../src/phone/phoneModel.ts";

test("preserves the 576x288 logical stage aspect ratio", () => {
  assert.equal(PHONE_HUD_WIDTH / PHONE_HUD_HEIGHT, 2);
  assert.equal(logicalStageScale(1152, 576), 2);
  assert.equal(logicalStageScale(800, 800), 800 / 576);
  assert.equal(logicalStageScale(0, 800), 1);
  assert.equal(logicalStageScale(1152, 576, 1.25), 2.5);
});

test("clamps fixture navigation steps without creating missed states", () => {
  assert.equal(nextFixtureStep(0, -1, 8), 0);
  assert.equal(nextFixtureStep(0, 1, 8), 1);
  assert.equal(nextFixtureStep(7, 1, 8), 7);
  assert.equal(nextFixtureStep(3, -2, 8), 1);
  assert.equal(nextFixtureStep(3, 1, 0), 0);
});
