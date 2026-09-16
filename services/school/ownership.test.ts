import assert from "node:assert/strict";
import test from "node:test";

import type { DurableOwner } from "@/services/ownership/owner";
import type { DatabaseOwnerReference, DurableOwnerRepositoryAdapter } from "@/services/ownership/repository";
import { resolveSchoolOwner, validateSchoolOwnerConsistency, validateSchoolParentChildOwnership } from "./ownership";

function owner(databaseOwnerId: string, kind: DatabaseOwnerReference["kind"], externalKey: string, legacyAccountId: string | null): DatabaseOwnerReference {
  return { databaseOwnerId, kind, externalKey, legacyAccountId };
}

function adapterFor(personal: DatabaseOwnerReference | null, accounts: Record<string, DatabaseOwnerReference | null> = {}): DurableOwnerRepositoryAdapter {
  return {
    async findPersonalOwner() { return personal; },
    async findLegacyAccountOwner(accountId) { return accounts[accountId] ?? null; },
    async accountExists(accountId) { return accountId in accounts; },
    async createLegacyAccountOwner(accountId) { return owner(`db-${accountId}`, "legacy-account", accountId, accountId); },
  };
}

const personal = owner("db-personal", "personal", "personal", null);
const accountA = owner("db-a", "legacy-account", "acct-a", "acct-a");
const accountB = owner("db-b", "legacy-account", "acct-b", "acct-b");

test("Personal and legacy accounts resolve through the School adapter", async () => {
  const adapter = adapterFor(personal, { "acct-a": accountA, "acct-b": accountB });
  assert.deepEqual(await resolveSchoolOwner({ kind: "personal", id: "personal" }, adapter), personal);
  assert.deepEqual(await resolveSchoolOwner({ kind: "legacy-account", accountId: "acct-a" }, adapter), accountA);
  assert.deepEqual(await resolveSchoolOwner({ kind: "legacy-account", accountId: "acct-b" }, adapter), accountB);
});

test("School adapter preserves Personal/account and cross-account separation", async () => {
  const adapter = adapterFor(personal, { "acct-a": accountA, "acct-b": accountB });
  assert.equal(await resolveSchoolOwner({ kind: "legacy-account", accountId: "acct-b" }, adapter), accountB);
  assert.notDeepEqual(await resolveSchoolOwner({ kind: "legacy-account", accountId: "acct-a" }, adapter), accountB);
  assert.notDeepEqual(await resolveSchoolOwner({ kind: "personal", id: "personal" }, adapter), accountA);
  const device = { kind: "device", deviceId: "device-1" } as unknown as DurableOwner;
  assert.equal(await resolveSchoolOwner(device, adapter), null);
});

test("School owner consistency rejects mismatched or client-shaped ownership", () => {
  assert.equal(validateSchoolOwnerConsistency(accountA, { ownerId: accountA.databaseOwnerId, userId: "acct-a" }), true);
  assert.equal(validateSchoolOwnerConsistency(accountA, { ownerId: accountB.databaseOwnerId, userId: "acct-a" }), false);
  assert.equal(validateSchoolOwnerConsistency(accountA, { ownerId: personal.databaseOwnerId, accountId: "acct-a" }), false);
  assert.equal(validateSchoolOwnerConsistency(personal, { ownerId: personal.databaseOwnerId }), true);
  assert.equal(validateSchoolOwnerConsistency(personal, { ownerId: personal.databaseOwnerId, accountId: "acct-a" }), false);
  assert.equal(validateSchoolOwnerConsistency(accountA, { ownerId: "client-selected-owner", accountId: "acct-a" }), false);
});

test("School parent and child ownership cannot diverge", () => {
  assert.equal(validateSchoolParentChildOwnership({ ownerId: accountA.databaseOwnerId, userId: "acct-a" }, { ownerId: accountA.databaseOwnerId, userId: "acct-a" }), true);
  assert.equal(validateSchoolParentChildOwnership({ ownerId: accountA.databaseOwnerId }, { ownerId: accountB.databaseOwnerId }), false);
  assert.equal(validateSchoolParentChildOwnership({ ownerId: personal.databaseOwnerId }, { ownerId: personal.databaseOwnerId }), true);
  assert.equal(validateSchoolParentChildOwnership({ ownerId: personal.databaseOwnerId }, { ownerId: accountA.databaseOwnerId }), false);
  assert.equal(validateSchoolParentChildOwnership({ ownerId: accountA.databaseOwnerId, userId: "acct-a" }, {}), true);
});
