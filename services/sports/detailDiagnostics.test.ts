import test from "node:test";
import assert from "node:assert/strict";
import { sportsDetailIsComplete, sportsDetailPresence } from "./detailDiagnostics";

const complete = { sport: "mlb", inning: 7, count: { balls: 2, strikes: 1, outs: 1 }, bases: { first: { base: 1 } }, matchup: { batter: { name: "Batter" }, pitcher: { name: "Pitcher" } }, latestPlay: { description: "Single" }, linescore: { innings: [] }, latestPitch: { velocityMph: 94 } };

test("MLB detail diagnostics identify a complete live detail payload", () => {
  const presence = sportsDetailPresence(complete);
  assert.equal(sportsDetailIsComplete(presence), true);
  assert.equal(presence.batter, true);
});

test("generic snapshots and partial details remain distinguishable", () => {
  assert.deepEqual(sportsDetailPresence(null), { detail: false });
  assert.equal(sportsDetailIsComplete(sportsDetailPresence({ sport: "mlb", inning: 3 })), false);
});
