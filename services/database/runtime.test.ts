import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner resolves the source extension directly.
import { resolveDatabaseConfiguration, resolveDatabaseDriver } from "./runtime.ts";

test("defaults hosted database selection to Neon", () => {
  assert.equal(resolveDatabaseDriver(undefined), "neon");
  assert.equal(resolveDatabaseDriver(""), "neon");
  assert.equal(resolveDatabaseDriver("  "), "neon");
});

test("selects the standard PostgreSQL driver explicitly", () => {
  assert.equal(resolveDatabaseDriver("postgres"), "postgres");
  assert.equal(resolveDatabaseConfiguration({ DATABASE_DRIVER: "postgres", DATABASE_URL: "postgres://db.example/cosmic" }).driver, "postgres");
});

test("preserves explicit Neon selection", () => {
  assert.equal(resolveDatabaseDriver("neon"), "neon");
  assert.deepEqual(resolveDatabaseConfiguration({ DATABASE_DRIVER: "neon", DATABASE_URL: "postgres://db.example/cosmic" }), { driver: "neon", url: "postgres://db.example/cosmic" });
});

test("rejects unsupported drivers", () => {
  assert.throws(() => resolveDatabaseDriver("supabase"), /DATABASE_DRIVER must be either/);
});

test("requires DATABASE_URL before selecting a runtime", () => {
  assert.throws(() => resolveDatabaseConfiguration({ DATABASE_DRIVER: "postgres" }), /DATABASE_URL is required/);
  assert.throws(() => resolveDatabaseConfiguration({ DATABASE_DRIVER: "postgres", DATABASE_URL: "  " }), /DATABASE_URL is required/);
});

test("production remains fail-closed when the hosted URL is absent", () => {
  assert.throws(() => resolveDatabaseConfiguration({ DATABASE_DRIVER: "postgres" }), /DATABASE_URL is required/);
});
