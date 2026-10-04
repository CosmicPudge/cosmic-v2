import assert from "node:assert/strict";
import test from "node:test";
import { formatFootballPenalty, normalizeFootballPenalty } from "./penalty";

test("penalties are reduced to readable type, team, yards, and enforcement", () => {
  const value = formatFootballPenalty(normalizeFootballPenalty({ text: "(Shotgun) pass incomplete. PENALTY on TB-A.Player, Defensive Holding, 5 yards, Automatic First Down", teamId: "tb", yards: 5 }, undefined, "Tampa Bay"));
  assert.deepEqual(value, { headline: "Defensive Holding · Tampa Bay", detail: "5 yards · Automatic First Down" });
});

test("declined, offsetting, and no-play penalties remain explicit without invented data", () => {
  assert.equal(formatFootballPenalty(normalizeFootballPenalty({ text: "Holding, declined", declined: true }, undefined, "Green Bay"))?.detail, "Declined");
  assert.equal(formatFootballPenalty(normalizeFootballPenalty({ text: "Offsetting penalties", offsetting: true }))?.headline, "Offsetting Penalties");
  assert.equal(formatFootballPenalty(normalizeFootballPenalty({ text: "Defensive Holding, 5 yards, no play", yards: 5 }, undefined, "Tampa Bay"))?.detail, "5 yards · No Play");
});
