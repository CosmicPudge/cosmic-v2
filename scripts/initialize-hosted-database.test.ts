import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner resolves the source extension directly.
import { createHostedPoolOptions, evaluatePostcheck, evaluatePrecheck, schoolTables, type MigrationInventory } from "./initialize-hosted-database.ts";

const freshSnapshot = {
  databaseName: "postgres",
  schemaName: "public",
  publicTableCount: 0,
  migrationJournalExists: false,
  usersExists: false,
  sessionsExists: false,
  accountIdentitiesExists: false,
  cosmicOwnersExists: false,
  schoolSourcesExists: false,
  schoolAssignmentsExists: false,
  schoolTables: Object.fromEntries(schoolTables.map((name) => [name, false])),
};

const initializedSnapshot = {
  ...freshSnapshot,
  publicTableCount: 12,
  migrationJournalExists: true,
  usersExists: true,
  sessionsExists: true,
  accountIdentitiesExists: true,
  cosmicOwnersExists: true,
  schoolSourcesExists: true,
  schoolAssignmentsExists: true,
  schoolTables: Object.fromEntries(schoolTables.map((name) => [name, true])),
};

const inventory: MigrationInventory = { sqlCount: 50, journalCount: 50, missing: [], extra: [], duplicates: [] };
const flags = { schemaReady: undefined, state: undefined };

test("hosted Pool configuration enables Supabase SSL without changing the URL source", () => {
  const options = createHostedPoolOptions("postgres://redacted.example/cosmic");
  assert.equal(options.connectionString, "postgres://redacted.example/cosmic");
  assert.equal(options.ssl.rejectUnauthorized, false);
  assert.equal(options.max, 1);
});

test("expected fresh state permits initialization", () => {
  assert.deepEqual(evaluatePrecheck(freshSnapshot, inventory, flags), { ok: true });
});

test("existing public tables reject initialization", () => {
  const result = evaluatePrecheck({ ...freshSnapshot, publicTableCount: 1 }, inventory, flags);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reasons.join("\n"), /public application table count/);
});

test("existing Drizzle journal rejects initialization", () => {
  const result = evaluatePrecheck({ ...freshSnapshot, migrationJournalExists: true }, inventory, flags);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reasons.join("\n"), /migration journal already exists/);
});

test("existing auth table rejects initialization", () => {
  const result = evaluatePrecheck({ ...freshSnapshot, usersExists: true }, inventory, flags);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reasons.join("\n"), /users/);
});

test("migration inventory mismatch rejects initialization", () => {
  const result = evaluatePrecheck(freshSnapshot, { ...inventory, missing: ["0042_missing"] }, flags);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reasons.join("\n"), /missing migration tags/);
});

test("failed postcheck does not report success", () => {
  const result = evaluatePostcheck({ ...initializedSnapshot, schoolSourcesExists: false }, 50, flags);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reasons.join("\n"), /school_sources/);
});
