import assert from "node:assert/strict";
import test from "node:test";

import { PERSONAL_PRINCIPAL, type CosmicPrincipal } from "@/services/auth/privateContext";
import {
  PERSONAL_OWNER,
  resolveDurableOwner,
  resolvePersonalOwner,
  serializeDurableOwner,
} from "./owner";

test("PersonalPrincipal resolves to the stable literal PersonalOwner", () => {
  const owner = resolvePersonalOwner(PERSONAL_PRINCIPAL);
  assert.strictEqual(owner, PERSONAL_OWNER);
  assert.deepEqual(owner, { kind: "personal", id: "personal" });
  assert.equal(owner?.id, "personal");
  assert.equal(/^[0-9a-f-]{20,}$/i.test(owner?.id ?? ""), false);
});

test("account and device principals never resolve as PersonalOwner", () => {
  const account: CosmicPrincipal = { kind: "account", accountId: "acct-1" };
  const device: CosmicPrincipal = { kind: "device", deviceId: "device-1" };
  assert.equal(resolvePersonalOwner(account), null);
  assert.equal(resolvePersonalOwner(device), null);
  assert.deepEqual(resolveDurableOwner(account), { kind: "legacy-account", accountId: "acct-1" });
  assert.equal(resolveDurableOwner(device), null);
});

test("ownership is derived only from the server principal, not client-shaped values", () => {
  const attackerInput = {
    accountId: "attacker-account",
    userId: "attacker-user",
    ownerId: "attacker-owner",
    email: "attacker@example.test",
    providerId: "attacker-provider",
    oauthSubject: "attacker-subject",
    deviceId: "attacker-device",
  };
  const owner = resolveDurableOwner(PERSONAL_PRINCIPAL);
  assert.deepEqual(owner, { kind: "personal", id: "personal" });
  assert.equal(JSON.stringify(owner).includes(JSON.stringify(attackerInput)), false);
  assert.equal(JSON.stringify(owner).includes("attacker"), false);
});

test("DurableOwner serialization contains identity only", () => {
  assert.deepEqual(serializeDurableOwner(PERSONAL_OWNER), { kind: "personal", id: "personal" });
  assert.deepEqual(serializeDurableOwner({ kind: "legacy-account", accountId: "acct-1" }), { kind: "legacy-account", accountId: "acct-1" });
  assert.equal(JSON.stringify(serializeDurableOwner(PERSONAL_OWNER)).includes("credential"), false);
  assert.equal(JSON.stringify(serializeDurableOwner(PERSONAL_OWNER)).includes("session"), false);
});
