import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner resolves the explicit TypeScript extension.
import { isKioskExitControlTarget, resolveKioskIdleTimeout, shouldWakeDesktopKiosk } from "./kioskPresentationLifecycle.ts";

test("desktop kiosk uses the configured idle timeout outside development", () => {
  assert.equal(resolveKioskIdleTimeout(300_000, 250, false), 300_000);
});

test("development idle override is bounded and optional", () => {
  assert.equal(resolveKioskIdleTimeout(300_000, 500, true), 500);
  assert.equal(resolveKioskIdleTimeout(300_000, 20, true), 300_000);
  assert.equal(resolveKioskIdleTimeout(300_000, null, true), 300_000);
});

test("desktop kiosk wakes for interaction but preserves its explicit exit control", () => {
  assert.equal(shouldWakeDesktopKiosk(false, false), false);
  assert.equal(shouldWakeDesktopKiosk(true, false), true);
  assert.equal(shouldWakeDesktopKiosk(true, true), false);
  assert.equal(shouldWakeDesktopKiosk(true, false, "manual"), false);
});

test("kiosk wake target handling recognizes normal and exit-control elements", () => {
  const normalElement = { closest: () => null } as unknown as EventTarget;
  const exitElement = {
    closest: (selector: string) => selector === "[data-kiosk-exit]" ? exitElement : null,
  } as unknown as EventTarget;
  const exitDescendant = {
    closest: (selector: string) => selector === "[data-kiosk-exit]" ? exitElement : null,
  } as unknown as EventTarget;

  assert.equal(isKioskExitControlTarget(normalElement), false);
  assert.equal(isKioskExitControlTarget(exitElement), true);
  assert.equal(isKioskExitControlTarget(exitDescendant), true);
});

test("kiosk wake target handling does not assume every EventTarget has closest", () => {
  assert.doesNotThrow(() => isKioskExitControlTarget({} as EventTarget));
  assert.equal(isKioskExitControlTarget({} as EventTarget), false);
  assert.equal(isKioskExitControlTarget(null), false);
});
