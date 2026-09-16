import assert from "node:assert/strict";
import test from "node:test";

import { resolvePersonalAccessAssertion, resolveVerifiedHostedPersonalAssertion } from "./personalAccess";

const mutableEnv = process.env as Record<string, string | undefined>;
const originalNodeEnv = process.env.NODE_ENV;

test.after(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
});

test("development loopback resolves the development personal assertion", () => {
  mutableEnv.NODE_ENV = "development";
  assert.deepEqual(resolvePersonalAccessAssertion(new Request("http://localhost:3000/private")), { kind: "development-loopback-personal" });
  assert.deepEqual(resolvePersonalAccessAssertion(new Request("http://127.0.0.1:3000/private")), { kind: "development-loopback-personal" });
});

test("development non-loopback does not resolve as personal", () => {
  mutableEnv.NODE_ENV = "development";
  assert.deepEqual(resolvePersonalAccessAssertion(new Request("https://cosmicpudge.shop/private")), { kind: "untrusted-public-request", reason: "no-verified-ingress" });
});

test("production remains fail-closed, including hostname and forwarded-header attempts", () => {
  mutableEnv.NODE_ENV = "production";
  const request = new Request("https://cosmicpudge.shop/private?ownerId=personal", {
    headers: {
      host: "localhost:3000",
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-user": "personal",
      "x-user": "personal",
      "x-email": "owner@example.test",
      "cf-access-authenticated-user-email": "owner@example.test",
    },
  });
  assert.deepEqual(resolvePersonalAccessAssertion(request), { kind: "untrusted-public-request", reason: "no-verified-ingress" });
  assert.equal(resolveVerifiedHostedPersonalAssertion(request), null);
});

test("hosted personal assertion is unavailable without a verified ingress adapter", () => {
  mutableEnv.NODE_ENV = "production";
  assert.equal(resolveVerifiedHostedPersonalAssertion(new Request("https://private.example/private")), null);
});
