import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { GOOGLE_IDENTITY_SCOPES, MICROSOFT_IDENTITY_SCOPES, appleIdentityConfiguration } from "./identityProviders.ts";

test("identity scopes do not include service permissions", () => {
  assert.deepEqual(GOOGLE_IDENTITY_SCOPES, ["openid", "email", "profile"]);
  assert.ok(!MICROSOFT_IDENTITY_SCOPES.includes("Mail.Read" as never));
  assert.ok(!MICROSOFT_IDENTITY_SCOPES.includes("Calendars.Read" as never));
});

test("Apple exposes an honest configuration boundary", () => {
  const previous = process.env.APPLE_CLIENT_ID;
  delete process.env.APPLE_CLIENT_ID;
  assert.equal(appleIdentityConfiguration(), "not_configured");
  if (previous) process.env.APPLE_CLIENT_ID = previous;
});
