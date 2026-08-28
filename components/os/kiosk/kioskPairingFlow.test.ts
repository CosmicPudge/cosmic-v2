import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { completeApprovedPairing } from "./kioskPairingFlow.ts";

async function run(helper: { ok: boolean; body: { state?: string; handoffToken?: string } | null }, consume = true) {
  const calls: string[] = [];
  const state = await completeApprovedPairing({
    bootId: "test-boot",
    pairingCode: "pairing-code",
    requestHelper: async (body) => { calls.push(`helper:${body.bootId}:${body.pairingCode}`); return helper; },
    consumeHandoff: async (token) => { calls.push(`consume:${token}`); return consume; },
    onAuthenticated: async () => { calls.push("authenticated"); },
  });
  return { state, calls };
}

test("approved pairing does not authenticate when helper returns 409", async () => {
  const result = await run({ ok: false, body: { state: "needs_provisioning" } });
  assert.equal(result.state, "enrolling");
  assert.deepEqual(result.calls, ["helper:test-boot:pairing-code"]);
});

test("approved pairing authenticates only after helper handoff and consume succeed", async () => {
  const result = await run({ ok: true, body: { state: "ready", handoffToken: "temporary-handoff" } });
  assert.equal(result.state, "authenticated");
  assert.deepEqual(result.calls, ["helper:test-boot:pairing-code", "consume:temporary-handoff", "authenticated"]);
});

test("reconnecting, recovery, missing token, and consume failures never authenticate", async () => {
  for (const helper of [{ ok: false, body: { state: "reconnecting" } }, { ok: false, body: { state: "identity_recovery" } }, { ok: true, body: { state: "ready" } }]) {
    const result = await run(helper);
    assert.notEqual(result.state, "authenticated");
    assert.equal(result.calls.includes("authenticated"), false);
  }
  const consumedFailure = await run({ ok: true, body: { state: "ready", handoffToken: "temporary-handoff" } }, false);
  assert.equal(consumedFailure.state, "reconnecting");
  assert.equal(consumedFailure.calls.includes("authenticated"), false);
});
