import assert from "node:assert/strict";
import test from "node:test";
import { footballDetailPollMode, footballDetailPollMs, FOOTBALL_LIVE_DETAIL_POLL_MS } from "./polling";

test("live football detail uses the 500ms cadence", () => {
  assert.equal(footballDetailPollMode("Live", "live"), "live");
  assert.equal(footballDetailPollMs("live"), FOOTBALL_LIVE_DETAIL_POLL_MS);
});

test("halftime and pregame use slower bounded cadences", () => {
  assert.equal(footballDetailPollMs(footballDetailPollMode("Halftime", "halftime")), 3_000);
  assert.equal(footballDetailPollMs(footballDetailPollMode("Scheduled", "pregame")), 30_000);
});

test("final football detail does not use the live loop", () => {
  assert.equal(footballDetailPollMode("Final", "final"), "final");
  assert.ok(footballDetailPollMs("final") > FOOTBALL_LIVE_DETAIL_POLL_MS);
});
