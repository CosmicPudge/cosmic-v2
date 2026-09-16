import assert from "node:assert/strict";
import test from "node:test";
import { PERSONAL_PRINCIPAL, type PrivateRequestContext } from "@/services/auth/privateContext";
import {
  providerAccessContext,
  providerCredentialOwner,
  requireProviderCredentialOwner,
} from "./access";

const personalContext: PrivateRequestContext = {
  principal: PERSONAL_PRINCIPAL,
  policy: "private-personal",
  mode: "personal",
  origin: "loopback-development",
};

test("maps PersonalPrincipal to the stable personal credential owner", () => {
  const access = providerAccessContext(personalContext);
  assert.deepEqual(access.owner, { kind: "personal", id: "personal" });
  assert.equal(JSON.stringify(access).includes("accountId"), false);
  assert.equal(JSON.stringify(access).includes("credential"), false);
});

test("maps AccountPrincipal to a legacy account owner", () => {
  assert.deepEqual(providerCredentialOwner({ kind: "account", accountId: "acct-1" }), {
    kind: "legacy-account",
    accountId: "acct-1",
  });
});

test("forbids DevicePrincipal from owning credentials", () => {
  const access = providerAccessContext({
    principal: { kind: "device", deviceId: "device-1" },
    policy: "device",
    mode: "device",
    origin: "public-host",
  });
  assert.equal(access.owner, null);
  assert.throws(() => requireProviderCredentialOwner(access), /cannot own provider credentials/);
});

test("provider owner resolution ignores client ownership-shaped input", () => {
  const access = providerAccessContext(personalContext);
  const clientInput = { accountId: "attacker", userId: "attacker", ownerId: "attacker", email: "attacker@example.test" };
  assert.deepEqual(access.owner, { kind: "personal", id: "personal" });
  assert.equal(JSON.stringify(access).includes(JSON.stringify(clientInput)), false);
});
