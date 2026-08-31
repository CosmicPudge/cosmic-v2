import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { toPublicCosmicAccount } from "./serialization.ts";

test("public account serialization excludes authentication material", () => {
  const internal = { id: "user-test", email: "owner@example.com", displayName: "Owner", createdAt: "2026-08-30T00:00:00.000Z", updatedAt: "2026-08-30T00:00:00.000Z", status: "active", passwordHash: "test-hash", passwordSalt: "test-salt", resetToken: "test-reset" };
  const account = toPublicCosmicAccount(internal);
  assert.deepEqual(account, { id: internal.id, email: internal.email, displayName: internal.displayName, createdAt: internal.createdAt, updatedAt: internal.updatedAt });
  assert.equal("passwordHash" in account, false);
  assert.equal("passwordSalt" in account, false);
  assert.equal("resetToken" in account, false);
});
