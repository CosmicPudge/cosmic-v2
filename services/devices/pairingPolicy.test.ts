import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript runner resolves the explicit extension.
import { resolvePairingIdentity } from "./pairingPolicy.ts";

test("valid device hint reuses the existing module", () => {
  assert.deepEqual(resolvePairingIdentity("device_existing", { id: "device_existing" }), { kind: "reuse", deviceId: "device_existing" });
});

test("stale or deleted device hint requests identity recovery", () => {
  assert.deepEqual(resolvePairingIdentity("device_deleted", null), { kind: "identity_missing", reason: "device_hint_unknown" });
});

test("missing device hint does not manufacture a module", () => {
  assert.deepEqual(resolvePairingIdentity(undefined, null), { kind: "identity_missing", reason: "device_hint_missing" });
});

test("a valid hint is paired to the identity returned by its exact lookup", () => {
  assert.deepEqual(resolvePairingIdentity("device_requested", { id: "device_requested" }), { kind: "reuse", deviceId: "device_requested" });
});
