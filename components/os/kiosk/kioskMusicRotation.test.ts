import assert from "node:assert/strict";
import test from "node:test";
import { KIOSK_MUSIC_PLAYBACK_STALE_MS, shouldPauseKioskForMusic } from "./kioskMusicRotation";

const now = 100_000;

test("Music plus active playback pauses standalone kiosk rotation", () => {
  assert.equal(shouldPauseKioskForMusic({ standalone: true, scene: "music", playing: true, lastSeenAt: now, now }), true);
});

test("paused playback and non-Music scenes remain rotatable", () => {
  assert.equal(shouldPauseKioskForMusic({ standalone: true, scene: "music", playing: false, lastSeenAt: now, now }), false);
  assert.equal(shouldPauseKioskForMusic({ standalone: true, scene: "calendar", playing: true, lastSeenAt: now, now }), false);
  assert.equal(shouldPauseKioskForMusic({ standalone: false, scene: "music", playing: true, lastSeenAt: now, now }), false);
});

test("a fresh playback signal pauses again and a stopped signal resumes rotation", () => {
  assert.equal(shouldPauseKioskForMusic({ standalone: true, scene: "music", playing: true, lastSeenAt: now, now: now + 1_000 }), true);
  assert.equal(shouldPauseKioskForMusic({ standalone: true, scene: "music", playing: false, lastSeenAt: now + 1_000, now: now + 1_000 }), false);
});

test("stale playback cannot hold the kiosk indefinitely", () => {
  assert.equal(shouldPauseKioskForMusic({ standalone: true, scene: "music", playing: true, lastSeenAt: now, now: now + KIOSK_MUSIC_PLAYBACK_STALE_MS + 1 }), false);
});
