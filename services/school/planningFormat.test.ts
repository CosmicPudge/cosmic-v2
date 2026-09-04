import assert from "node:assert/strict";
import test from "node:test";
import { formatEstimatedMinutes, isSafeProviderUrl } from "./planningFormat";

test("formats planning durations consistently", () => {
  assert.equal(formatEstimatedMinutes(null), "Not Specified");
  assert.equal(formatEstimatedMinutes(15), "15 min");
  assert.equal(formatEstimatedMinutes(60), "1 hr");
  assert.equal(formatEstimatedMinutes(90), "1 hr 30 min");
  assert.equal(formatEstimatedMinutes(120), "2 hr");
});

test("accepts only absolute HTTP(S) provider URLs", () => {
  assert.equal(isSafeProviderUrl("https://canvas.example.edu/courses/1"), true);
  assert.equal(isSafeProviderUrl("http://canvas.example.edu/calendar"), true);
  assert.equal(isSafeProviderUrl("javascript:alert(1)"), false);
  assert.equal(isSafeProviderUrl("data:text/html,hello"), false);
  assert.equal(isSafeProviderUrl("not a url"), false);
  assert.equal(isSafeProviderUrl(undefined), false);
});
