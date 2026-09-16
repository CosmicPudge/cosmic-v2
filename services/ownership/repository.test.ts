import assert from "node:assert/strict";
import test from "node:test";

import type { DurableOwner } from "./owner";
import { resolveDurableOwnerRecord, type DatabaseOwnerReference, type DurableOwnerRepositoryAdapter } from "./repository";

function owner(databaseOwnerId: string, kind: DatabaseOwnerReference["kind"], externalKey: string, legacyAccountId: string | null): DatabaseOwnerReference {
  return { databaseOwnerId, kind, externalKey, legacyAccountId };
}

function adapterFor(input: {
  personal?: DatabaseOwnerReference | null;
  accounts?: Record<string, DatabaseOwnerReference | null>;
  existingAccounts?: string[];
  create?: (accountId: string) => Promise<DatabaseOwnerReference | null>;
} = {}): DurableOwnerRepositoryAdapter {
  const accounts = { ...(input.accounts ?? {}) };
  const existingAccounts = new Set(input.existingAccounts ?? Object.keys(accounts));
  return {
    async findPersonalOwner() { return input.personal ?? null; },
    async findLegacyAccountOwner(accountId) { return accounts[accountId] ?? null; },
    async accountExists(accountId) { return existingAccounts.has(accountId); },
    async createLegacyAccountOwner(accountId) {
      const created = input.create ? await input.create(accountId) : owner(`db-${accountId}`, "legacy-account", accountId, accountId);
      if (created) accounts[accountId] = created;
      return created;
    },
  };
}

test("Personal resolves only a canonical Personal registry row", async () => {
  const row = owner("db-personal", "personal", "personal", null);
  const resolved = await resolveDurableOwnerRecord({ kind: "personal", id: "personal" }, adapterFor({ personal: row }));
  assert.deepEqual(resolved, row);
  assert.equal(resolved?.databaseOwnerId, "db-personal");
  assert.notEqual(resolved?.databaseOwnerId, "personal");
});

test("missing or malformed Personal rows fail closed without account fallback", async () => {
  const malformed = owner("db-bad", "personal", "wrong", null);
  for (const personal of [null, malformed]) {
    const resolved = await resolveDurableOwnerRecord({ kind: "personal", id: "personal" }, adapterFor({ personal, accounts: { "acct-1": owner("db-acct", "legacy-account", "acct-1", "acct-1") } }));
    assert.equal(resolved, null);
  }
});

test("legacy accounts resolve their own existing mappings", async () => {
  const accountA = owner("db-a", "legacy-account", "acct-a", "acct-a");
  const accountB = owner("db-b", "legacy-account", "acct-b", "acct-b");
  const adapter = adapterFor({ accounts: { "acct-a": accountA, "acct-b": accountB } });
  assert.deepEqual(await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "acct-a" }, adapter), accountA);
  assert.deepEqual(await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "acct-b" }, adapter), accountB);
});

test("cross-account, Personal, and malformed mappings fail closed", async () => {
  const adapter = adapterFor({
    accounts: {
      "acct-a": owner("db-b", "legacy-account", "acct-b", "acct-b"),
      "acct-b": owner("db-personal", "personal", "personal", null),
    },
  });
  assert.equal(await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "acct-a" }, adapter), null);
  assert.equal(await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "acct-b" }, adapter), null);
  assert.equal(await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "missing" }, adapter), null);
});

test("missing legacy mapping uses the safe create path", async () => {
  let creates = 0;
  const adapter = adapterFor({
    existingAccounts: ["acct-new"],
    create: async (accountId) => { creates += 1; return owner("db-new", "legacy-account", accountId, accountId); },
  });
  const resolved = await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "acct-new" }, adapter);
  assert.deepEqual(resolved, owner("db-new", "legacy-account", "acct-new", "acct-new"));
  assert.equal(creates, 1);
});

test("a uniqueness race converges by reading the canonical mapping", async () => {
  let creates = 0;
  const canonical = owner("db-raced", "legacy-account", "acct-raced", "acct-raced");
  const adapter = adapterFor({
    existingAccounts: ["acct-raced"],
    create: async () => { creates += 1; return null; },
  });
  const originalFind = adapter.findLegacyAccountOwner;
  let reads = 0;
  const racedAdapter: DurableOwnerRepositoryAdapter = {
    ...adapter,
    async findLegacyAccountOwner(accountId) {
      reads += 1;
      if (reads === 2) return canonical;
      return originalFind(accountId);
    },
  };
  assert.deepEqual(await resolveDurableOwnerRecord({ kind: "legacy-account", accountId: "acct-raced" }, racedAdapter), canonical);
  assert.equal(creates, 1);
});

test("a DevicePrincipal-shaped value cannot be resolved as a DurableOwner", async () => {
  const device = { kind: "device", deviceId: "device-1" } as unknown as DurableOwner;
  assert.equal(await resolveDurableOwnerRecord(device, adapterFor()), null);
});
