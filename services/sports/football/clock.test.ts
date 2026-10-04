import assert from "node:assert/strict";
import test from "node:test";
import { clockSampleProgressed, formatFootballClock, interpolateFootballClock, parseFootballClock } from "./clock";

test("football clock interpolates downward without crossing zero", () => {
  assert.equal(parseFootballClock("10:02"), 602);
  assert.equal(interpolateFootballClock("10:02", 2_000, true), "10:00");
  assert.equal(interpolateFootballClock("0:01", 2_000, true), "0:00");
  assert.equal(formatFootballClock(602), "10:02");
});

test("clock progression and repeated samples are distinguishable", () => {
  assert.equal(clockSampleProgressed({ period: 3, clock: "10:02", observedAt: 0 }, { period: 3, clock: "10:01", observedAt: 500 }), true);
  assert.equal(clockSampleProgressed({ period: 3, clock: "10:02", observedAt: 0 }, { period: 3, clock: "10:02", observedAt: 500 }), false);
  assert.equal(clockSampleProgressed({ period: 3, clock: "0:00", observedAt: 0 }, { period: 4, clock: "15:00", observedAt: 500 }), false);
});
