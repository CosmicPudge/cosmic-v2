import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { classifyDatabaseRuntime } from "./runtime.ts";

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
