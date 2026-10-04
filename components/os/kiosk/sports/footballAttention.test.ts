import assert from "node:assert/strict";
import test from "node:test";
import { advanceFootballPenaltyLifecycle, FOOTBALL_PENALTY_DISPLAY_MS, footballPenaltyIsVisible, footballPlayIdentity } from "./footballAttention";

test("a penalty is visible for a bounded window and does not retrigger while the same play persists", () => {
  const first = advanceFootballPenaltyLifecycle({ visibleUntil: 0 }, "play:flag-1", 1_000);
  assert.equal(footballPenaltyIsVisible(first, 1_000), true);
  const same = advanceFootballPenaltyLifecycle(first, "play:flag-1", 1_000 + FOOTBALL_PENALTY_DISPLAY_MS + 1);
  assert.equal(footballPenaltyIsVisible(same, 1_000 + FOOTBALL_PENALTY_DISPLAY_MS + 1), false);
  const repeated = advanceFootballPenaltyLifecycle(same, "play:flag-1", 20_000);
  assert.equal(footballPenaltyIsVisible(repeated, 20_000), false);
});

test("a new penalty gets a fresh bounded lifecycle", () => {
  const first = advanceFootballPenaltyLifecycle({ visibleUntil: 0 }, "play:flag-1", 1_000);
  const next = advanceFootballPenaltyLifecycle({ ...first, identity: undefined }, "play:flag-2", 2_000);
  assert.equal(footballPenaltyIsVisible(next, 2_000), true);
  assert.equal(next.visibleUntil, 2_000 + FOOTBALL_PENALTY_DISPLAY_MS);
});

test("delayed penalty enrichment creates a new revision for the same play", () => {
  const play = { id: "play-123", description: "Pass incomplete" };
  assert.notEqual(footballPlayIdentity(play), footballPlayIdentity({ ...play, penalty: true }, { text: "Defensive Holding", teamId: "tb", yards: 5 }));
  assert.equal(footballPlayIdentity({ ...play, penalty: true }, { text: "Defensive Holding", teamId: "tb", yards: 5 }), footballPlayIdentity({ ...play, penalty: true }, { text: "Defensive Holding", teamId: "tb", yards: 5 }));
});
