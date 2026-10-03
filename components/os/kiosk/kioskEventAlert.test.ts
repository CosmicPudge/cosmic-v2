import assert from "node:assert/strict";
import test from "node:test";
import { shouldResumeMusicAfterAlert } from "./kioskEventAlertControl";

test("normal event alert resumes only playback Cosmic paused", () => {
  assert.equal(shouldResumeMusicAfterAlert({ wasPlayingBeforeAlert: true, pausedByCosmic: true, playbackChangedDuringAlert: false }), true);
  assert.equal(shouldResumeMusicAfterAlert({ wasPlayingBeforeAlert: true, pausedByCosmic: false, playbackChangedDuringAlert: false }), false);
});

test("manual playback changes prevent forced resume", () => {
  assert.equal(shouldResumeMusicAfterAlert({ wasPlayingBeforeAlert: true, pausedByCosmic: true, playbackChangedDuringAlert: true }), false);
  assert.equal(shouldResumeMusicAfterAlert({ wasPlayingBeforeAlert: false, pausedByCosmic: true, playbackChangedDuringAlert: false }), false);
});
