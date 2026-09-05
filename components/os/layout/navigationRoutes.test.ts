import assert from "node:assert/strict";
import test from "node:test";

import { isNavigationRouteActive, navigationModuleEnabled } from "./navigationRoutes";

test("matches exact and nested routes without false prefix matches", () => {
  assert.equal(isNavigationRouteActive("/sports", "/sports"), true);
  assert.equal(isNavigationRouteActive("/sports/event/123", "/sports"), true);
  assert.equal(isNavigationRouteActive("/sportsmanship", "/sports"), false);
  assert.equal(isNavigationRouteActive("/os", "/os"), true);
  assert.equal(isNavigationRouteActive("/os/settings", "/os"), false);
});

test("maps module preferences to navigation visibility", () => {
  assert.equal(navigationModuleEnabled("music", { music: false }), true);
  assert.equal(navigationModuleEnabled("sports", { sports: false }), false);
  assert.equal(navigationModuleEnabled("gmail", { mail: false }), false);
  assert.equal(navigationModuleEnabled("school", { school: true }), true);
});
