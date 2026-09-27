import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { authErrorResponse } from "./http.ts";

test("redacts unknown database failures from auth responses", async () => {
  const error = Object.assign(new Error("insert into users values (password_hash, password_salt) ..."), {
    code: "23502",
    table: "users",
    column: "password_hash",
  });
  const response = authErrorResponse(error, "Account creation failed.", 400);
  const payload = await response.json() as { error: string };

  assert.equal(response.status, 400);
  assert.deepEqual(payload, { error: "Account creation failed." });
  assert.equal(JSON.stringify(payload).includes("password_hash"), false);
  assert.equal(JSON.stringify(payload).includes("password_salt"), false);
});

test("preserves only known safe auth messages", async () => {
  const response = authErrorResponse(new Error("Email or password is incorrect."), "Sign in failed.", 401);
  assert.deepEqual(await response.json(), { error: "Email or password is incorrect." });
});

test("maps the known duplicate-email conflict without exposing database details", async () => {
  const error = Object.assign(new Error("duplicate key value violates unique constraint"), {
    code: "23505",
    constraint: "users_normalized_email_unique",
  });
  const response = authErrorResponse(error, "Account creation failed.", 400);

  assert.deepEqual(await response.json(), { error: "An account with that email already exists." });
});
