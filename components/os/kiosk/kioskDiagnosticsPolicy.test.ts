import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isKioskDiagnosticsRequested, kioskDiagnosticsRenderState } from "./kioskDiagnosticsPolicy.js";

const standaloneSource = readFileSync(resolve(process.cwd(), "components/os/kiosk/StandaloneDesktopKiosk.tsx"), "utf8");
const diagnosticsSource = readFileSync(resolve(process.cwd(), "components/os/kiosk/KioskDiagnosticsView.tsx"), "utf8");

test("normal kiosk URL renders the normal slideshow state", () => {
  assert.equal(isKioskDiagnosticsRequested(new URLSearchParams("cosmic-kiosk=1"), "dev.cosmicpudge.shop"), false);
  assert.equal(kioskDiagnosticsRenderState(false, false), "normal");
});

test("diagnostics remains in establishing-session state until runtime is ready", () => {
  const requested = isKioskDiagnosticsRequested(new URLSearchParams("cosmic-kiosk=1&cosmic-boot=boot&diagnostics=1"), "dev.cosmicpudge.shop");
  assert.equal(requested, true);
  assert.equal(kioskDiagnosticsRenderState(requested, false), "establishing-session");
});

test("diagnostics renders only after session/runtime readiness", () => {
  assert.equal(kioskDiagnosticsRenderState(true, true), "diagnostics");
  assert.match(standaloneSource, /renderState === "diagnostics"/);
  assert.match(diagnosticsSource, /\/api\/kiosk\/diagnostics/);
});

test("diagnostics query survives because the live standalone route does not replace the URL", () => {
  const url = new URL("https://dev.cosmicpudge.shop/kiosk?cosmic-kiosk=1&cosmic-boot=boot&diagnostics=1");
  assert.equal(url.searchParams.get("diagnostics"), "1");
  assert.equal(standaloneSource.includes("router.replace"), false);
  assert.equal(standaloneSource.includes("replaceState"), false);
});

test("production hosts cannot activate the diagnostics view", () => {
  assert.equal(isKioskDiagnosticsRequested(new URLSearchParams("diagnostics=1"), "cosmicpudge.shop"), false);
});

test("diagnostics mode avoids normal slideshow pollers and timers", () => {
  assert.match(standaloneSource, /renderState === "normal" \? <ConnectionHealthProvider>/);
  assert.match(standaloneSource, /renderState === "diagnostics" \? <KioskDiagnosticsView \/>/);
  assert.match(diagnosticsSource, /credentials: "same-origin"/);
  assert.equal(diagnosticsSource.includes("setInterval"), false);
});

test("diagnostics UI renders safe authentication failure metadata", () => {
  assert.match(diagnosticsSource, /Cookie/);
  assert.match(diagnosticsSource, /Session lookup/);
  assert.match(diagnosticsSource, /Boot match/);
  assert.match(diagnosticsSource, /response\.status === 401/);
  assert.match(diagnosticsSource, /body\?\.auth/);
  assert.doesNotMatch(diagnosticsSource, /sessionId|deviceId|accountId/);
});

test("diagnostics bootstrap requires a boot-bound authenticated device session", () => {
  assert.match(standaloneSource, /sessionBody\.sessionType === "device"/);
  assert.match(standaloneSource, /sessionBody\.authenticatedBootId === bootId/);
});
