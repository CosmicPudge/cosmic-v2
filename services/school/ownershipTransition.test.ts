import assert from "node:assert/strict";
import test from "node:test";

import type { DatabaseOwnerReference, DurableOwnerRepositoryAdapter } from "@/services/ownership/repository";
import { getSchoolOwnershipState, prepareSchoolOwnerWrite, runSchoolOwnerBackfill, validateSchoolDualRead, type SchoolBackfillStore, type SchoolOwnerRow } from "./ownershipTransition";

const personal: DatabaseOwnerReference = { databaseOwnerId: "db-personal", kind: "personal", externalKey: "personal", legacyAccountId: null };
const ownerA: DatabaseOwnerReference = { databaseOwnerId: "db-a", kind: "legacy-account", externalKey: "a", legacyAccountId: "a" };
const ownerB: DatabaseOwnerReference = { databaseOwnerId: "db-b", kind: "legacy-account", externalKey: "b", legacyAccountId: "b" };

function adapterFor(accounts: Record<string, DatabaseOwnerReference | null>): DurableOwnerRepositoryAdapter {
  return {
    async findPersonalOwner() { return personal; },
    async findLegacyAccountOwner(accountId) { return accounts[accountId] ?? null; },
    async accountExists(accountId) { return accountId in accounts; },
    async createLegacyAccountOwner(accountId) { return accounts[accountId] ?? null; },
  };
}

function storeFor(rows: SchoolOwnerRow[], owners: Record<string, DatabaseOwnerReference | null>): SchoolBackfillStore & { writes: string[] } {
  const state = rows.map((row) => ({ ...row }));
  const writes: string[] = [];
  return {
    writes,
    async listRows(_table, cursor, limit) { return state.filter((row) => !cursor || row.id > cursor).slice(0, limit); },
    async findOwnerById(id) { return owners[id] ?? null; },
    async ensureLegacyOwner(accountId) { return accountId === "a" ? ownerA : accountId === "b" ? ownerB : null; },
    async setOwnerId(_table, id, ownerId) { const row = state.find((item) => item.id === id); if (row) row.ownerId = ownerId; if (ownerId === ownerA.databaseOwnerId) owners[ownerId] = ownerA; if (ownerId === ownerB.databaseOwnerId) owners[ownerId] = ownerB; writes.push(`${id}:${ownerId}`); },
  };
}

test("legacy-only is the safe default and schema readiness gates dual write", () => {
  assert.equal(getSchoolOwnershipState({}), "LEGACY_ONLY");
  assert.equal(getSchoolOwnershipState({ COSMIC_SCHOOL_OWNERSHIP_STATE: "DUAL_WRITE" }), "LEGACY_ONLY");
  assert.equal(getSchoolOwnershipState({ COSMIC_SCHOOL_OWNERSHIP_STATE: "DUAL_WRITE", COSMIC_SCHOOL_OWNER_SCHEMA_READY: "true" }), "DUAL_WRITE");
});

test("dual write derives owner A server-side and rejects client owner IDs", async () => {
  const env = { COSMIC_SCHOOL_OWNERSHIP_STATE: "DUAL_WRITE", COSMIC_SCHOOL_OWNER_SCHEMA_READY: "true" };
  const result = await prepareSchoolOwnerWrite({ userId: "a" }, "a", adapterFor({ a: ownerA }), env);
  assert.equal(result.ownerId, "db-a");
  await assert.rejects(() => prepareSchoolOwnerWrite({ userId: "a", ownerId: "db-b" }, "a", adapterFor({ a: ownerA }), env), /client_owner_id_forbidden/);
  await assert.rejects(() => prepareSchoolOwnerWrite({ userId: "a" }, "a", adapterFor({ a: personal }), env), /school_owner_unavailable/);
});

test("dual read validates agreement without OR-based authorization", () => {
  assert.equal(validateSchoolDualRead({ userId: "a", ownerId: null }, ownerA, "DUAL_WRITE"), "allow-null");
  assert.equal(validateSchoolDualRead({ userId: "a", ownerId: "db-a" }, ownerA, "OWNER_PREFERRED"), "allow");
  assert.equal(validateSchoolDualRead({ userId: "a", ownerId: "db-b" }, ownerB, "DUAL_WRITE"), "reject");
  assert.equal(validateSchoolDualRead({ userId: "a", ownerId: "db-personal" }, personal, "DUAL_WRITE"), "reject");
  assert.equal(validateSchoolDualRead({ userId: "a" }, null, "LEGACY_ONLY"), "allow");
});

test("backfill maps NULL rows, leaves correct rows unchanged, and is repeatable", async () => {
  const store = storeFor([{ id: "a-1", legacyAccountId: "a", ownerId: null }, { id: "a-2", legacyAccountId: "a", ownerId: "db-a" }], { "db-a": ownerA });
  const first = await runSchoolOwnerBackfill(store, { batchSize: 1 });
  assert.equal(first.stopped, false);
  assert.equal(first.tables.school_assignments.mappedDuringExecution, 1);
  assert.equal(first.tables.school_assignments.alreadyCorrect, 1);
  assert.deepEqual(store.writes, ["a-1:db-a"]);
});

test("backfill fails closed for cross-account, Personal, and unknown ownership", async () => {
  for (const ownerId of ["db-b", "db-personal"]) {
    const store = storeFor([{ id: "a-1", legacyAccountId: "a", ownerId }], { "db-b": ownerB, "db-personal": personal, "db-missing": null });
    const report = await runSchoolOwnerBackfill(store);
    assert.equal(report.stopped, true);
    assert.equal(report.failureReason, "ownership_mismatch");
    assert.equal(store.writes.length, 0);
  }
  const missing = storeFor([{ id: "a-1", legacyAccountId: "a", ownerId: "db-missing" }], { "db-missing": null });
  const missingReport = await runSchoolOwnerBackfill(missing);
  assert.equal(missingReport.failureReason, "unresolved_owner");
  const unknown = storeFor([{ id: "x-1", legacyAccountId: "unknown", ownerId: null }], {});
  const report = await runSchoolOwnerBackfill(unknown);
  assert.equal(report.failureReason, "unresolved_owner");
});

test("backfill isolates multiple accounts and never uses Personal for legacy rows", async () => {
  const store = storeFor([{ id: "b-1", legacyAccountId: "b", ownerId: null }, { id: "a-1", legacyAccountId: "a", ownerId: null }], {});
  const report = await runSchoolOwnerBackfill(store, { batchSize: 100 });
  assert.equal(report.stopped, false);
  assert.deepEqual(store.writes, ["a-1:db-a", "b-1:db-b"]);
  assert.ok(store.writes.every((write) => !write.includes("personal")));
});
