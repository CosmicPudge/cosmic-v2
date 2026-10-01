import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveKioskSwipeDirection, shouldResetKioskRotationAfterSwipe } from "./kioskSlideshowInteraction.js";
import { isLockedStandaloneKioskPath, shouldExitLockedStandaloneKioskOnInteraction } from "./standaloneKioskPolicy.js";
import { KIOSK_SLIDE_DURATION_MS } from "./kioskConfig.js";

const standaloneSource = readFileSync(resolve(process.cwd(), "components/os/kiosk/StandaloneDesktopKiosk.tsx"), "utf8");

test("dedicated kiosk ignores pointer, touch, and click exit behavior", () => {
  assert.equal(isLockedStandaloneKioskPath("/kiosk"), true);
  assert.equal(shouldExitLockedStandaloneKioskOnInteraction("/kiosk", "pointerdown"), false);
  assert.equal(shouldExitLockedStandaloneKioskOnInteraction("/kiosk", "touchstart"), false);
  assert.equal(shouldExitLockedStandaloneKioskOnInteraction("/kiosk", "click"), false);
  assert.equal(shouldExitLockedStandaloneKioskOnInteraction("/os", "pointerdown"), true);
});

test("standalone kiosk renders no visible exit control", () => {
  assert.equal(/data-kiosk-exit|Exit Kiosk|End Kiosk/.test(standaloneSource), false);
});

test("horizontal swipes choose next and previous while taps do nothing", () => {
  assert.equal(resolveKioskSwipeDirection(-120, 10, 50), 1);
  assert.equal(resolveKioskSwipeDirection(120, 10, 50), -1);
  assert.equal(resolveKioskSwipeDirection(20, 10, 50), null);
  assert.equal(resolveKioskSwipeDirection(120, 140, 50), null);
});

test("manual swipe resets rotation and production interval is two minutes", () => {
  assert.equal(shouldResetKioskRotationAfterSwipe(), true);
  assert.equal(KIOSK_SLIDE_DURATION_MS, 120_000);
});
