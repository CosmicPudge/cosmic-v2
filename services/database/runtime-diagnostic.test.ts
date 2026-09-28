import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { canRunDatabaseDiagnostic, classifyDatabaseFailure, classifyDatabaseRuntime, checkDatabaseStatus } from "./runtime.ts";

test("classifies a Supabase direct PostgreSQL runtime without exposing URL details", () => {
  const result = classifyDatabaseRuntime({
    DATABASE_DRIVER: "postgres",
    DATABASE_URL: "postgresql://user:password@db.cosmic-preview.supabase.co:5432/postgres?sslmode=require",
  });
  assert.deepEqual(result, { driver: "postgres", provider: "supabase", connectionMode: "direct", urlPresent: true });
  assert.equal(JSON.stringify(result).includes("password"), false);
  assert.equal(JSON.stringify(result).includes("cosmic-preview"), false);
  assert.equal(JSON.stringify(result).includes("supabase.co"), false);
});

test("classifies Supabase session and transaction poolers safely", () => {
  assert.deepEqual(classifyDatabaseRuntime({ DATABASE_DRIVER: "postgres", DATABASE_URL: "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:5432/postgres" }), { driver: "postgres", provider: "supabase", connectionMode: "session-pooler", urlPresent: true });
  assert.deepEqual(classifyDatabaseRuntime({ DATABASE_DRIVER: "postgres", DATABASE_URL: "postgresql://u:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres" }), { driver: "postgres", provider: "supabase", connectionMode: "transaction-pooler", urlPresent: true });
});

test("classifies Neon and missing drivers", () => {
  assert.deepEqual(classifyDatabaseRuntime({ DATABASE_DRIVER: "neon", DATABASE_URL: "postgresql://u:p@ep-example.us-east-2.aws.neon.tech/neondb" }), { driver: "neon", provider: "neon", connectionMode: "unknown", urlPresent: true });
  assert.deepEqual(classifyDatabaseRuntime({ DATABASE_URL: "postgresql://u:p@db.example.test/postgres" }), { driver: "missing", provider: "other", connectionMode: "unknown", urlPresent: true });
});

test("reports invalid or absent database configuration without echoing secrets", () => {
  const invalid = classifyDatabaseRuntime({ DATABASE_DRIVER: "supabase", DATABASE_URL: "not a URL with password" });
  assert.deepEqual(invalid, { driver: "invalid", provider: "unknown", connectionMode: "unknown", urlPresent: true });
  const absent = classifyDatabaseRuntime({});
  assert.deepEqual(absent, { driver: "missing", provider: "unknown", connectionMode: "unknown", urlPresent: false });
  assert.equal(JSON.stringify(invalid).includes("password"), false);
  assert.equal(JSON.stringify(invalid).includes("not a URL"), false);
});

test("allows the existing diagnostic only outside Production", () => {
  assert.equal(canRunDatabaseDiagnostic({ VERCEL_ENV: "preview", NODE_ENV: "production" }), true);
  assert.equal(canRunDatabaseDiagnostic({ VERCEL_ENV: "production", NODE_ENV: "production" }), false);
  assert.equal(canRunDatabaseDiagnostic({ NODE_ENV: "production" }), false);
});

test("classifies structured failures without inspecting messages", () => {
  assert.deepEqual(classifyDatabaseFailure({ code: "ENOTFOUND", message: "postgres://user:password@private.supabase.co" }), { category: "dns", code: "DNS_RESOLUTION_FAILED" });
  assert.deepEqual(classifyDatabaseFailure({ code: "CERT_HAS_EXPIRED", message: "private certificate and password" }), { category: "tls", code: "TLS_NEGOTIATION_FAILED" });
  assert.deepEqual(classifyDatabaseFailure({ code: "28P01", message: "password authentication failed" }), { category: "authentication", code: "POSTGRES_AUTHENTICATION_FAILED" });
  assert.deepEqual(classifyDatabaseFailure({ code: "ECONNREFUSED" }), { category: "connection_refused", code: "CONNECTION_REFUSED" });
  assert.deepEqual(classifyDatabaseFailure({ code: "ETIMEDOUT" }), { category: "timeout", code: "CONNECTION_TIMEOUT" });
  assert.deepEqual(classifyDatabaseFailure({ code: "08006" }), { category: "postgres", code: "POSTGRES_CONNECTION_FAILED" });
  assert.deepEqual(classifyDatabaseFailure(new Error("postgres://user:password@private.supabase.co/project")), { category: "unknown", code: "DATABASE_CONNECTION_FAILED" });
});

test("performs exactly one read-only connectivity check and sanitizes failure", async () => {
  const queries: string[] = [];
  const success = await checkDatabaseStatus({ configured: true, check: async () => { queries.push("SELECT 1"); return undefined; } });
  assert.deepEqual(success, { configured: true, connected: true });
  assert.deepEqual(queries, ["SELECT 1"]);

  const failure = await checkDatabaseStatus({ configured: true, check: async () => { throw Object.assign(new Error("postgres://user:password@private.supabase.co/project"), { code: "ETIMEDOUT" }); } });
  assert.deepEqual(failure, { configured: true, connected: false, failure: { category: "timeout", code: "CONNECTION_TIMEOUT" } });
  assert.equal(JSON.stringify(failure).includes("postgres"), false);
  assert.equal(JSON.stringify(failure).includes("password"), false);
  assert.equal(JSON.stringify(failure).includes("supabase"), false);
});
