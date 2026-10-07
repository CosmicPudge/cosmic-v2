import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dataRoute = readFileSync(resolve(process.cwd(), "app/api/kiosk/data/route.ts"), "utf8");
const diagnosticsRoute = readFileSync(resolve(process.cwd(), "app/api/kiosk/diagnostics/route.ts"), "utf8");
const handoffRoute = readFileSync(resolve(process.cwd(), "app/api/devices/handoff/consume/route.ts"), "utf8");

test("data and diagnostics use the same authenticated kiosk session validator", () => {
  assert.match(dataRoute, /getDeveloperKioskSession/);
  assert.match(diagnosticsRoute, /getDeveloperKioskSession/);
  assert.doesNotMatch(dataRoute, /getCurrentCosmicSession|kioskBootId/);
  assert.doesNotMatch(diagnosticsRoute, /getCurrentCosmicSession|kioskBootId/);
});

test("shared kiosk validator preserves device-only and boot-bound auth requirements", () => {
  const source = readFileSync(resolve(process.cwd(), "services/kiosk/auth.ts"), "utf8");
  assert.match(source, /allowUser: false/);
  assert.match(source, /allowDevice: true/);
  assert.match(source, /bootId: kioskBootId\(request\)/);
});

test("redemption cookie is host-wide and covers both kiosk API routes", () => {
  assert.match(handoffRoute, /name: "cosmic_session"/);
  assert.match(handoffRoute, /path: "\/"/);
  assert.match(handoffRoute, /sameSite: "lax"/);
  assert.match(handoffRoute, /httpOnly: true/);
  assert.match(handoffRoute, /secure: process\.env\.NODE_ENV === "production"/);
  assert.doesNotMatch(handoffRoute, /domain:/i);
});

test("auth policy rejects missing, expired/missing, wrong-kind, and boot-mismatched sessions", async () => {
  const { classifyKioskAuth } = await import("./kioskAuthPolicy.js");
  assert.equal(classifyKioskAuth({ cookiePresent: false, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false }).authResult, "missing-cookie");
  assert.equal(classifyKioskAuth({ cookiePresent: true, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false }).authResult, "session-miss");
  assert.equal(classifyKioskAuth({ cookiePresent: true, sessionFound: true, sessionKind: "user", bootBound: false, bootMatch: false }).authResult, "wrong-kind");
  assert.equal(classifyKioskAuth({ cookiePresent: true, sessionFound: true, sessionKind: "device", bootBound: true, bootMatch: false }).authResult, "boot-mismatch");
  assert.equal(classifyKioskAuth({ cookiePresent: true, sessionFound: true, sessionKind: "device", bootBound: true, bootMatch: true }).authResult, "ok");
});

test("auth debug logging contains only safe status fields", () => {
  const source = readFileSync(resolve(process.cwd(), "services/kiosk/auth.ts"), "utf8");
  const logLine = source.split("\n").find((line) => line.includes("[kiosk-auth-debug]")) ?? "";
  assert.match(logLine, /cookiePresent=.*sessionLookup=.*sessionKind=.*bootBound=.*bootMatch=.*authResult=/);
  assert.doesNotMatch(logLine, /token|deviceId|sessionId|requestedBootId|authenticatedBootId/i);
});
