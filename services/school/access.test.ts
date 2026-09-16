import assert from "node:assert/strict";
import test from "node:test";

import { personalSchoolAccessContext, getSchoolAccess } from "./access";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;
const originalOwner = process.env.COSMIC_OWNER_USER_ID;

test.beforeEach(() => {
  mutableEnv.NODE_ENV = "development";
  delete mutableEnv.COSMIC_OWNER_USER_ID;
});

test.after(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
  if (originalOwner === undefined) delete mutableEnv.COSMIC_OWNER_USER_ID;
  else mutableEnv.COSMIC_OWNER_USER_ID = originalOwner;
});

test("localhost personal access separates request identity from legacy DB ownership", () => {
  const access = personalSchoolAccessContext(new Request("http://localhost:3000/api/school/calendar"));
  assert.ok(access);
  assert.deepEqual(access.principal, { kind: "personal" });
  assert.deepEqual(access.storageOwner, {
    kind: "unavailable",
    reason: "personal-storage-owner-not-mapped",
  });
});

test("personal School access never contains or derives an account UUID", () => {
  const access = personalSchoolAccessContext(new Request("http://127.0.0.1:3000/api/school/sources"));
  assert.ok(access);
  assert.equal(access.principal.kind, "personal");
  assert.equal(access.storageOwner.kind, "unavailable");
  assert.equal("accountId" in access.principal, false);
  assert.equal("accountId" in access.storageOwner, false);
});

test("personal School access ignores client identity parameters", () => {
  const access = personalSchoolAccessContext(new Request("http://localhost:3000/api/school/assets/a?userId=attacker&accountId=attacker"));
  assert.deepEqual(access?.principal, { kind: "personal" });
  assert.equal(access?.storageOwner.kind, "unavailable");
});

test("production and forwarded-host requests do not resolve personal School access", () => {
  mutableEnv.NODE_ENV = "production";
  assert.equal(personalSchoolAccessContext(new Request("https://cosmicpudge.shop/api/school/calendar", { headers: { "x-forwarded-host": "localhost:3000" } })), null);
});

test("legacy account access remains owner-gated without selecting a first user", () => {
  mutableEnv.COSMIC_OWNER_USER_ID = "user_owner";
  assert.equal(getSchoolAccess({ id: "user_owner" }).enabled, true);
  assert.equal(getSchoolAccess({ id: "user_other" }).enabled, false);
  assert.equal(getSchoolAccess(null).enabled, false);
});
