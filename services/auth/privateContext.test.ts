import assert from "node:assert/strict";
import test from "node:test";

import {
  requirePrivateRequestContext,
  resolvePrivateRequestContext,
  type PrivateAccessPolicy,
} from "./privateContext";

const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

test.beforeEach(() => {
  mutableEnv.NODE_ENV = "development";
});

test.after(() => {
  if (originalNodeEnv === undefined) delete mutableEnv.NODE_ENV;
  else mutableEnv.NODE_ENV = originalNodeEnv;
});

function request(url: string, init?: RequestInit) {
  return new Request(url, init);
}

function contextFor(url: string, policy: PrivateAccessPolicy = "private-personal") {
  return resolvePrivateRequestContext(request(url), policy);
}

test("localhost development resolves an explicit personal private context", () => {
  const context = contextFor("http://localhost:3000/api/dev/future-personal");
  assert.deepEqual(context, {
    principal: { kind: "personal" },
    policy: "private-personal",
    mode: "personal",
    origin: "loopback-development",
  });
});

test("the personal principal has no account UUID, session, or account object", () => {
  const context = contextFor("http://127.0.0.1:3000/private");
  assert.ok(context);
  assert.deepEqual(Object.keys(context.principal), ["kind"]);
  assert.equal("accountId" in context.principal, false);
  assert.equal("session" in context.principal, false);
  assert.equal("account" in context.principal, false);
});

test("client query values cannot alter the personal principal", () => {
  const context = contextFor("http://localhost:3000/private?userId=attacker&accountId=attacker");
  assert.deepEqual(context?.principal, { kind: "personal" });
});

test("arbitrary forwarded host headers cannot grant personal access", () => {
  const context = resolvePrivateRequestContext(
    request("https://cosmicpudge.shop/private", {
      headers: { "x-forwarded-host": "localhost:3000", host: "localhost:3000" },
    }),
    "private-personal",
  );
  assert.equal(context, null);
});

test("the production public hostname fails closed", () => {
  mutableEnv.NODE_ENV = "production";
  assert.equal(contextFor("https://cosmicpudge.shop/private"), null);
});

test("device, webhook, internal, and public UI policies never become personal", () => {
  for (const policy of ["device", "webhook", "internal", "public-ui"] as const) {
    assert.equal(contextFor("http://localhost:3000/private", policy), null);
  }
});

test("unresolved private access fails closed with unauthorized", () => {
  assert.throws(
    () => requirePrivateRequestContext(request("https://cosmicpudge.shop/private"), "private-personal"),
    (error: unknown) => error instanceof Response && error.status === 401,
  );
});
