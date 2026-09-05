import test from "node:test";
import assert from "node:assert/strict";
import { deriveAmbientProgress, formatAmbientProgress } from "./ambientProgress";

const updatedAt = new Date(10_000).toISOString();

test("interpolates active playback from the authoritative timestamp", () => assert.equal(deriveAmbientProgress({ positionMs: 1_000, durationMs: 10_000, playing: true, updatedAt }, 12_500).progressMs, 3_500));
test("does not advance paused playback", () => assert.equal(deriveAmbientProgress({ positionMs: 1_000, durationMs: 10_000, playing: false, updatedAt }, 12_500).progressMs, 1_000));
test("clamps progress to duration", () => assert.equal(deriveAmbientProgress({ positionMs: 9_900, durationMs: 10_000, playing: true, updatedAt }, 20_000).progressMs, 10_000));
test("stops extrapolating stale playback", () => assert.equal(deriveAmbientProgress({ positionMs: 1_000, durationMs: 10_000, playing: true, updatedAt }, 70_000).stale, true));
test("supports missing duration without inventing one", () => assert.deepEqual(deriveAmbientProgress({ positionMs: 1_000, playing: true, updatedAt }, 12_000), { progressMs: 3_000, durationMs: undefined, stale: false }));
test("formats short and long durations", () => { assert.equal(formatAmbientProgress(7_000), "0:07"); assert.equal(formatAmbientProgress(62_000), "1:02"); assert.equal(formatAmbientProgress(3_734_000), "1:02:14"); });
