import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { classifyConnectionFailure, safeDatabaseErrorCode, safeDatabaseClientName } from "./connectionDiagnostics.ts";

test("classifies safe database connection codes without exposing messages", () => {
  assert.equal(classifyConnectionFailure({ code: "28P01", message: "password omitted" }), "authentication-failed");
  assert.equal(classifyConnectionFailure({ code: "ENOTFOUND" }), "dns-error");
  assert.equal(classifyConnectionFailure({ code: "ECONNREFUSED" }), "connection-refused");
  assert.equal(classifyConnectionFailure({ code: "ETIMEDOUT" }), "timeout");
  assert.equal(classifyConnectionFailure({ code: "SELF_SIGNED_CERT_IN_CHAIN" }), "tls-error");
  assert.equal(classifyConnectionFailure({ code: "ERR_INVALID_URL" }), "parse-error");
});

test("extracts only bounded codes, including a bounded cause", () => {
  assert.equal(safeDatabaseErrorCode({ cause: { code: "28P01" } }), "28P01");
  assert.equal(safeDatabaseErrorCode({ code: "postgres://user:password@host/db" }), null);
});

test("reports safe client package names", () => {
  assert.equal(safeDatabaseClientName("postgres"), "pg via drizzle-orm/node-postgres");
  assert.equal(safeDatabaseClientName("neon"), "@neondatabase/serverless via drizzle-orm/neon-serverless");
});
