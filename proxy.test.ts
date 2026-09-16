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

test("personal School development access is narrower than the OS exemption", () => {
  const source = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");
  const schoolBranch = source.indexOf("isPersonalSchoolDevelopmentRequest");
  const authorizationTry = source.indexOf("  try {", schoolBranch);
  assert.ok(schoolBranch >= 0);
  assert.ok(authorizationTry > schoolBranch);
  assert.equal(source.slice(schoolBranch, authorizationTry).includes("getCurrentCosmicAccount"), false);
  assert.equal(source.includes('pathname !== "/api/school/calendar"'), true);
});

test("personal Finance keeps the UI open but blocks connected APIs before account auth", () => {
  const source = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");
  const financeBranch = source.indexOf("isPersonalFinanceDevelopmentRequest");
  const authorizationTry = source.indexOf("  try {", financeBranch);
  assert.ok(financeBranch >= 0);
  assert.ok(authorizationTry > financeBranch);
  assert.equal(source.slice(financeBranch, authorizationTry).includes("getCurrentCosmicAccount"), false);
  assert.equal(source.includes('"storage-unavailable-in-personal-mode"'), true);
});
