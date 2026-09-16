import assert from "node:assert/strict";
import test from "node:test";

import { personalFinanceAccessContext, requireFinanceStorageOwner } from "./access";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;

test.beforeEach(() => { mutableEnv.NODE_ENV = "development"; });
test.after(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
});

test("localhost Finance resolves personal request identity without durable ownership", () => {
  const access = personalFinanceAccessContext(new Request("http://localhost:3000/api/finance/connected-data"));
  assert.ok(access);
  assert.deepEqual(access.principal, { kind: "personal" });
  assert.deepEqual(access.storageOwner, { kind: "unavailable", reason: "personal-storage-owner-not-mapped" });
  assert.equal("accountId" in access.principal, false);
});

test("Finance ignores client account and user identity", () => {
  const access = personalFinanceAccessContext(new Request("http://localhost:3000/api/finance/connected-data?accountId=attacker&userId=attacker"));
  assert.equal(access?.storageOwner.kind, "unavailable");
});

test("personal connected Finance returns controlled unavailable without resolving an owner", async () => {
  await assert.rejects(
    () => requireFinanceStorageOwner(new Request("http://127.0.0.1:3000/api/finance/connections/link-token")),
    (error: unknown) => error instanceof Response && error.status === 503,
  );
});

test("production personal Finance remains fail-closed", () => {
  mutableEnv.NODE_ENV = "production";
  assert.equal(personalFinanceAccessContext(new Request("https://cosmicpudge.shop/api/finance/connected-data", { headers: { "x-forwarded-host": "localhost:3000" } })), null);
});
