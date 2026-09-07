import assert from "node:assert/strict";
import test from "node:test";

import { reconcilePushSubscription, reconcileWhenAuthenticated, serializePushSubscription } from "./registration";

test("serializes an existing browser subscription for status and registration APIs", () => {
  const json = { endpoint: "https://push.example/subscription", expirationTime: null, keys: { p256dh: "public-key", auth: "auth-secret" } };
  const subscription = { toJSON: () => json } as unknown as PushSubscription;
  assert.deepEqual(serializePushSubscription(subscription), json);
});

test("missing browser subscription serializes as null", () => {
  assert.equal(serializePushSubscription(null), null);
});

test("existing subscription mounts through status, upsert, and confirmation without creating another subscription", async () => {
  const calls: string[] = [];
  let toJsonCalls = 0;
  const subscription = { toJSON: () => { toJsonCalls += 1; return { endpoint: "https://push.example/subscription", keys: { p256dh: "public-key", auth: "auth-secret" } }; } } as unknown as PushSubscription;
  const fetcher: typeof fetch = async (input) => {
    calls.push(String(input));
    const registered = calls.length === 3;
    return new Response(JSON.stringify({ configured: true, registered }), { status: 200 });
  };
  const result = await reconcileWhenAuthenticated({ accountLoading: false, authenticated: true, discover: async () => subscription, reconcile: (current) => reconcilePushSubscription(current, fetcher) });
  assert.equal(result, "enabled");
  assert.deepEqual(calls, ["/api/push/status", "/api/push/subscribe", "/api/push/status"]);
  assert.equal(toJsonCalls, 1);
});

test("auth readiness waits, then reconciles exactly once", async () => {
  let discoveries = 0;
  const discover = async () => { discoveries += 1; return null; };
  const reconcile = async () => "not-enabled" as const;
  assert.equal(await reconcileWhenAuthenticated({ accountLoading: true, authenticated: false, discover, reconcile }), "waiting");
  assert.equal(discoveries, 0);
  assert.equal(await reconcileWhenAuthenticated({ accountLoading: false, authenticated: true, discover, reconcile }), "not-enabled");
  assert.equal(discoveries, 1);
});

test("already registered subscription does not upsert", async () => {
  const calls: string[] = [];
  const subscription = { toJSON: () => ({ endpoint: "https://push.example/subscription", keys: { p256dh: "public-key", auth: "auth-secret" } }) } as unknown as PushSubscription;
  const fetcher: typeof fetch = async (input) => { calls.push(String(input)); return new Response(JSON.stringify({ configured: true, registered: true }), { status: 200 }); };
  assert.equal(await reconcilePushSubscription(subscription, fetcher), "enabled");
  assert.deepEqual(calls, ["/api/push/status"]);
});

test("reconciliation failure never reports enabled", async () => {
  const subscription = { toJSON: () => ({ endpoint: "https://push.example/subscription", keys: { p256dh: "public-key", auth: "auth-secret" } }) } as unknown as PushSubscription;
  const fetcher: typeof fetch = async () => new Response(JSON.stringify({ configured: true, registered: false }), { status: 503 });
  await assert.rejects(() => reconcilePushSubscription(subscription, fetcher));
});
