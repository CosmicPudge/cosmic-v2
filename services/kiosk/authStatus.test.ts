import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routeSource = readFileSync(resolve(process.cwd(), "app/api/kiosk/auth-status/route.ts"), "utf8");
const proxySource = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");

test("dev auth-status uses the shared inspection validator and host gate", () => {
  assert.match(routeSource, /isDeveloperKioskRequest/);
  assert.match(routeSource, /inspectDeveloperKioskAuthStatus/);
  assert.match(routeSource, /status: 404/);
  assert.match(routeSource, /status: 200|Response\.json\(auth/);
});

test("proxy lets the gated diagnostics routes reach their route handlers", () => {
  assert.match(proxySource, /pathname === "\/api\/kiosk\/diagnostics"/);
  assert.match(proxySource, /pathname === "\/api\/kiosk\/auth-status"/);
});

test("auth-status response source contains no forbidden sensitive fields", () => {
  assert.doesNotMatch(routeSource, /cookie|sessionId|deviceId|accountId|bootId|token|credential|timestamp|ipAddress/i);
});

test("auth-status exposes the exact safe status field names", async () => {
  const { classifyKioskAuth } = await import("./kioskAuthPolicy.js");
  const missing = classifyKioskAuth({ cookiePresent: false, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false });
  const miss = classifyKioskAuth({ cookiePresent: true, sessionFound: false, sessionKind: "none", bootBound: false, bootMatch: false });
  const valid = classifyKioskAuth({ cookiePresent: true, sessionFound: true, sessionKind: "device", bootBound: true, bootMatch: true });
  const mismatch = classifyKioskAuth({ cookiePresent: true, sessionFound: true, sessionKind: "device", bootBound: true, bootMatch: false });
  assert.equal(missing.authResult, "missing-cookie");
  assert.equal(miss.authResult, "session-miss");
  assert.equal(valid.authResult, "ok");
  assert.equal(mismatch.authResult, "boot-mismatch");
});
