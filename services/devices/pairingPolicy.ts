export type PairingIdentityDecision =
  | { kind: "identity_missing"; reason: "device_hint_missing" | "device_hint_unknown" }
  | { kind: "reuse"; deviceId: string };

/** Pairing may claim an existing module, but never manufactures one. */
export function resolvePairingIdentity(existingDeviceId: string | undefined, existingDevice: { id: string } | null): PairingIdentityDecision {
  if (!existingDeviceId) return { kind: "identity_missing", reason: "device_hint_missing" };
  if (!existingDevice) return { kind: "identity_missing", reason: "device_hint_unknown" };
  return { kind: "reuse", deviceId: existingDevice.id };
}
