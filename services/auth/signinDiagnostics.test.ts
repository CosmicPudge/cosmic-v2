import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { classifySigninDatabaseError, createSigninStageLogger, logSigninCategory } from "./signinDiagnostics.ts";

test("signin diagnostics emit only bounded stage lines", () => {
  const lines: string[] = [];
  const logger = createSigninStageLogger(true, (line) => lines.push(line));

  logger?.("lookup-start");
  logger?.("lookup-error", "schema-error");
  logSigninCategory(true, "schema-error", (line) => lines.push(line));

  assert.deepEqual(lines, [
    "[auth] signin.stage=lookup-start",
    "[auth] signin.stage=lookup-error category=schema-error",
    "[auth] signin.category=schema-error",
  ]);
});

test("signin diagnostics are disabled without logging", () => {
  const lines: string[] = [];
  assert.equal(createSigninStageLogger(false, (line) => lines.push(line)), undefined);
  logSigninCategory(false, "unknown", (line) => lines.push(line));
  assert.deepEqual(lines, []);
});

test("database schema errors are bounded without exposing error text", () => {
  const error = Object.assign(new Error("relation users does not exist"), { code: "42P01" });
  assert.equal(classifySigninDatabaseError(error), "table-missing");
  assert.equal(classifySigninDatabaseError(new Error("connection failed")), "database-error");
  assert.equal(classifySigninDatabaseError(new Error("session insert failed"), "session"), "session-write-error");
});
