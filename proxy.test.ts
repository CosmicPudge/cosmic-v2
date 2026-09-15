import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isPersonalOsUiRoute } from "./services/auth/proxyPolicy";

test("normal OS routes are personal UI routes", () => {
  assert.equal(isPersonalOsUiRoute("/os"), true);
  assert.equal(isPersonalOsUiRoute("/os/weather"), true);
  assert.equal(isPersonalOsUiRoute("/os/settings"), true);
  assert.equal(isPersonalOsUiRoute("/os/kiosk"), false);
  assert.equal(isPersonalOsUiRoute("/os/kiosk/error"), false);
  assert.equal(isPersonalOsUiRoute("/finance"), false);
  assert.equal(isPersonalOsUiRoute("/api/finance/goals"), false);
});

test("personal OS exemption precedes account-backed proxy authorization", () => {
  const source = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");
  const personalBranch = source.indexOf('if (isPersonalOsUiRoute(pathname))');
  const authorizationTry = source.indexOf("  try {", personalBranch);
  assert.ok(personalBranch >= 0);
  assert.ok(authorizationTry > personalBranch);
  assert.equal(source.slice(personalBranch, authorizationTry).includes("getCurrentCosmicAccount"), false);
});
