import "server-only";

import { createHash, createHmac, randomBytes, randomUUID } from "crypto";
import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { devices, deviceEnrollmentGrants, devicePairings, deviceSessionHandoffs, kioskDeviceSettings, sessions } from "@/services/database/schema";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { hashSessionToken } from "@/services/auth/localStore";
import { resolvePairingIdentity } from "./pairingPolicy";

export const DEVICE_PAIRING_TTL_MS = 10 * 60 * 1000;
export const DEVICE_POLL_INTERVAL_SECONDS = 4;
export const DEVICE_HANDOFF_TTL_MS = 60 * 1000;
export const DEVICE_ENROLLMENT_TTL_MS = 10 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pairLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[pair] ${message}`);
}

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function normalizeUserCode(value: string) { return value.replace(/[^A-Z0-9]/gi, "").toUpperCase(); }
function formatUserCode(value: string) { return `${value.slice(0, 4)}-${value.slice(4)}`; }
function randomUserCode() { return Array.from({ length: 6 }, () => ALPHABET[randomBytes(1)[0] % ALPHABET.length]).join(""); }
function newDeviceCredential() { return randomBytes(32).toString("base64url"); }
function enrollmentGrant(challengeId: string, challengeHash: string) {
  const secret = process.env.COSMIC_ENROLLMENT_SECRET;
  if (!secret) throw new Error("COSMIC_ENROLLMENT_SECRET is required for device enrollment.");
  return createHmac("sha256", secret).update(`${challengeId}:${challengeHash}`).digest("base64url");
}
function requireDatabase() { if (!isDatabaseConfigured()) throw new Error("Device pairing requires durable PostgreSQL storage."); return getDatabase(); }
export function normalizeBootId(value: unknown) { return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null; }

export type DevicePairingCreation =
  | { status: "identity_missing"; reason: "device_hint_missing" | "device_hint_unknown" }
  | { status: "created"; deviceCode: string; userCode: string; deviceNumber: string; verificationUrl: string; expiresAt: string; pollInterval: number };

export async function createDevicePairing(bootId: string, existingDeviceId?: string): Promise<DevicePairingCreation> {
  if (!existingDeviceId) return { status: "identity_missing", reason: "device_hint_missing" };
  const database = requireDatabase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const deviceCode = randomBytes(32).toString("base64url");
    const userCode = randomUserCode();
    try {
      const result = await database.transaction(async (tx) => {
        const [existing] = await tx.select({ id: devices.id, publicNumber: devices.publicNumber }).from(devices).where(and(eq(devices.id, existingDeviceId), isNull(devices.revokedAt))).limit(1);
        const identity = resolvePairingIdentity(existingDeviceId, existing);
        if (identity.kind === "identity_missing") return { status: identity.kind, reason: identity.reason };
        const [row] = await tx.insert(devicePairings).values({ id: `pair_${randomUUID()}`, deviceCodeHash: hash(deviceCode), userCode, expiresAt: new Date(Date.now() + DEVICE_PAIRING_TTL_MS), deviceType: "display", bootId, deviceId: identity.deviceId }).returning({ id: devicePairings.id, userCode: devicePairings.userCode, expiresAt: devicePairings.expiresAt });
        return { status: "created" as const, row, deviceId: identity.deviceId, publicNumber: existing.publicNumber };
      });
      if (result.status === "identity_missing") return result;
      const row = result.row;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cosmicpudge.shop";
      pairLog(`created id=${row.id} status=pending boot=${bootId}`);
      return { status: "created", deviceCode, userCode: formatUserCode(row.userCode), deviceNumber: result.publicNumber, verificationUrl: `${baseUrl}/activate?code=${encodeURIComponent(formatUserCode(row.userCode))}`, expiresAt: row.expiresAt.toISOString(), pollInterval: DEVICE_POLL_INTERVAL_SECONDS };
    } catch (error) {
      if (attempt === 4) throw error;
    }
  }
  throw new Error("Could not create device pairing.");
}

export async function getPairingStatus(deviceCode: string) {
  const database = requireDatabase();
  const [row] = await database.select().from(devicePairings).where(eq(devicePairings.deviceCodeHash, hash(deviceCode))).limit(1);
  if (!row) return { status: "expired" as const };
  const now = new Date();
  if (row.status === "pending" && row.expiresAt <= now) {
    await database.update(devicePairings).set({ status: "expired" }).where(and(eq(devicePairings.id, row.id), eq(devicePairings.status, "pending")));
    return { status: "expired" as const };
  }
  if (row.status === "pending") await database.update(devicePairings).set({ lastPolledAt: now }).where(eq(devicePairings.id, row.id));
  const status = row.status === "approved" ? "approved" as const : row.status === "denied" ? "denied" as const : row.status === "consumed" ? "expired" as const : "pending" as const;
  pairLog(`poll id=${row.id} status=${status}`);
  return { status };
}

export async function approveDevicePairing(userCodeInput: string, userId: string) {
  const database = requireDatabase();
  const userCode = normalizeUserCode(userCodeInput);
  if (userCode.length !== 6) return false;
  return database.transaction(async (tx) => {
    const [row] = await tx.select().from(devicePairings).where(and(eq(devicePairings.userCode, userCode), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).for("update").limit(1);
    if (!row) return false;
    if (!row.deviceId) return false;
    const [device] = await tx.select({ id: devices.id, userId: devices.userId, revokedAt: devices.revokedAt }).from(devices).where(eq(devices.id, row.deviceId)).limit(1);
    // A public pairing code must never transfer an existing device to a
    // different account. The owner must explicitly revoke/reset it first.
    if (!device || device.revokedAt || (device.userId && device.userId !== userId)) return false;
    const deviceId = device.id;
    await tx.update(devices).set({ userId, ownershipStatus: "owned", revokedAt: null }).where(eq(devices.id, deviceId));
    const [updated] = await tx.update(devicePairings).set({ status: "approved", userId, approvedAt: new Date(), deviceName: "Cosmic Display", deviceId }).where(and(eq(devicePairings.id, row.id), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).returning({ id: devicePairings.id, deviceId: devicePairings.deviceId });
    if (!updated) return false;
    pairLog(`approved id=${updated.id} status=approved`);
    return { deviceId: updated.deviceId! };
  });
}

export async function denyDevicePairing(userCodeInput: string, userId: string) {
  const database = requireDatabase();
  const userCode = normalizeUserCode(userCodeInput);
  const updated = await database.update(devicePairings).set({ status: "denied", userId }).where(and(eq(devicePairings.userCode, userCode), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).returning({ id: devicePairings.id });
  return Boolean(updated[0]);
}

export async function consumeApprovedPairing(deviceCode: string) {
  const database = requireDatabase();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  let step = "transaction";
  try {
    return await database.transaction(async (tx) => {
      step = "consume-check";
      const [pairing] = await tx.select().from(devicePairings).where(and(eq(devicePairings.deviceCodeHash, hash(deviceCode)), eq(devicePairings.status, "approved"), gt(devicePairings.expiresAt, new Date()), isNull(devicePairings.consumedAt))).for("update").limit(1);
      if (!pairing?.userId) return null;
      pairLog(`consume-start id=${pairing.id}`);
      pairLog("consume-check-expiry ok=true");
      step = "device";
      if (!pairing.deviceId) return null;
      const [existingDevice] = await tx.select({ id: devices.id, publicNumber: devices.publicNumber }).from(devices).where(and(eq(devices.id, pairing.deviceId), eq(devices.userId, pairing.userId), isNull(devices.revokedAt))).limit(1);
      if (!existingDevice) return null;
      const deviceId = existingDevice.id;
      const credential = newDeviceCredential();
      await tx.update(devices).set({ lastSeenAt: new Date(), credentialHash: hash(credential), credentialRevokedAt: null, ownershipStatus: "owned", revokedAt: null }).where(eq(devices.id, deviceId));
      pairLog(`consume-device deviceId=${deviceId}`);
      step = "session-create";
      pairLog("consume-session-create start");
      const sessionId = `session_${randomUUID()}`;
      await tx.insert(sessions).values({ id: sessionId, userId: pairing.userId, sessionTokenHash: hashSessionToken(token), expiresAt, sessionType: "device", deviceId, authenticatedBootId: pairing.bootId, userAgent: "Cosmic Display" });
      pairLog(`[pair-consume] pairingId=${pairing.id} deviceId=${deviceId} sessionCreated=true sessionType=device authenticatedBootId=${pairing.bootId}`);
      pairLog("consume-session-create success");
      step = "mark-consumed";
      const [consumed] = await tx.update(devicePairings).set({ status: "consumed", consumedAt: new Date() }).where(and(eq(devicePairings.id, pairing.id), eq(devicePairings.status, "approved"), isNull(devicePairings.consumedAt))).returning({ id: devicePairings.id, consumedAt: devicePairings.consumedAt });
      if (!consumed) throw new Error("Pairing could not be marked consumed.");
      pairLog(`[pair-consume] pairingId=${consumed.id} pairingConsumed=${Boolean(consumed.consumedAt)}`);
      const [device] = await tx.select({ publicNumber: devices.publicNumber }).from(devices).where(eq(devices.id, deviceId)).limit(1);
      return { token, expiresAt: expiresAt.toISOString(), deviceId, deviceNumber: device?.publicNumber ?? "", credential };
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const diagnostic = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
      console.error(`[pair] consume-error step=${step} ${diagnostic}`);
    }
    throw error;
  }
}

export async function listDevices(userId: string) {
  const database = requireDatabase();
  return database.select({ id: devices.id, publicNumber: devices.publicNumber, name: devices.name, type: devices.type, createdAt: devices.createdAt, lastSeenAt: devices.lastSeenAt, revokedAt: devices.revokedAt }).from(devices).where(and(eq(devices.userId, userId), eq(devices.ownershipStatus, "owned"), isNull(devices.revokedAt))).orderBy(devices.createdAt);
}

export async function prepareDeviceForNewOwner(userId: string, deviceId: string) {
  const database = requireDatabase();
  const now = new Date();
  return database.transaction(async (tx) => {
    const [device] = await tx.select({ id: devices.id }).from(devices).where(and(eq(devices.id, deviceId), eq(devices.userId, userId), eq(devices.ownershipStatus, "owned"), isNull(devices.revokedAt))).for("update").limit(1);
    if (!device) return false;
    await tx.update(devices).set({ userId: null, ownershipStatus: "unclaimed", credentialHash: null, credentialRevokedAt: now, revokedAt: null, lastSeenAt: now }).where(eq(devices.id, deviceId));
    await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.deviceId, deviceId), isNull(sessions.revokedAt)));
    await tx.delete(kioskDeviceSettings).where(eq(kioskDeviceSettings.deviceId, deviceId));
    return true;
  });
}

export const revokeDevice = prepareDeviceForNewOwner;

export async function authenticateDeviceCredential(credential: string, bootId: string, userAgent?: string) {
  const database = requireDatabase();
  const [device] = await database.select({ id: devices.id, userId: devices.userId, publicNumber: devices.publicNumber, ownershipStatus: devices.ownershipStatus }).from(devices).where(and(eq(devices.credentialHash, hash(credential)), isNull(devices.credentialRevokedAt), isNull(devices.revokedAt))).limit(1);
  if (!device) return null;
  if (device.ownershipStatus !== "owned" || !device.userId) return { state: device.ownershipStatus as "unclaimed" | "resetting", deviceId: device.id, deviceNumber: device.publicNumber };
  const session = await createDeviceSession(device.userId, device.id, bootId, userAgent);
  await database.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, device.id));
  return { ...session, state: "owned" as const, deviceNumber: device.publicNumber };
}

export async function createDeviceSessionHandoff(credential: string, bootId: string) {
  const database = requireDatabase();
  const [device] = await database.select({ id: devices.id, userId: devices.userId }).from(devices).where(and(eq(devices.credentialHash, hash(credential)), isNull(devices.credentialRevokedAt), isNull(devices.revokedAt))).limit(1);
  if (!device?.userId) return null;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DEVICE_HANDOFF_TTL_MS);
  await database.insert(deviceSessionHandoffs).values({ id: `handoff_${randomUUID()}`, tokenHash: hash(token), deviceId: device.id, userId: device.userId, bootId, expiresAt });
  return { token, deviceId: device.id, expiresAt: expiresAt.toISOString() };
}

export async function consumeDeviceSessionHandoff(token: string, bootId: string, userAgent?: string) {
  const database = requireDatabase();
  const now = new Date();
  const [handoff] = await database.select({ id: deviceSessionHandoffs.id, deviceId: deviceSessionHandoffs.deviceId, userId: deviceSessionHandoffs.userId }).from(deviceSessionHandoffs).where(and(eq(deviceSessionHandoffs.tokenHash, hash(token)), eq(deviceSessionHandoffs.bootId, bootId), gt(deviceSessionHandoffs.expiresAt, now), isNull(deviceSessionHandoffs.consumedAt))).limit(1);
  if (!handoff) return null;
  const [claimed] = await database.update(deviceSessionHandoffs).set({ consumedAt: now }).where(and(eq(deviceSessionHandoffs.id, handoff.id), isNull(deviceSessionHandoffs.consumedAt), gt(deviceSessionHandoffs.expiresAt, now))).returning({ id: deviceSessionHandoffs.id });
  if (!claimed) return null;
  const session = await createDeviceSession(handoff.userId, handoff.deviceId, bootId, userAgent);
  return { ...session, deviceId: handoff.deviceId };
}

export async function createDeviceEnrollmentChallenge(deviceId: string, publicNumber: string, challenge: string) {
  const database = requireDatabase();
  const [device] = await database.select({ id: devices.id, publicNumber: devices.publicNumber }).from(devices).where(and(eq(devices.id, deviceId), eq(devices.publicNumber, publicNumber), isNull(devices.revokedAt))).limit(1);
  if (!device) return null;
  const expiresAt = new Date(Date.now() + DEVICE_ENROLLMENT_TTL_MS);
  const [row] = await database.insert(deviceEnrollmentGrants).values({ id: `enroll_${randomUUID()}`, deviceId, challengeHash: hash(challenge), expiresAt }).returning({ id: deviceEnrollmentGrants.id, expiresAt: deviceEnrollmentGrants.expiresAt });
  return row ? { challengeId: row.id, expiresAt: row.expiresAt.toISOString(), deviceId, publicNumber } : null;
}

export async function authorizeDeviceEnrollment(challengeId: string, userId: string) {
  const database = requireDatabase();
  const [candidate] = await database.select({ id: deviceEnrollmentGrants.id, deviceId: deviceEnrollmentGrants.deviceId, challengeHash: deviceEnrollmentGrants.challengeHash }).from(deviceEnrollmentGrants).where(and(eq(deviceEnrollmentGrants.id, challengeId), isNull(deviceEnrollmentGrants.approvedAt), isNull(deviceEnrollmentGrants.consumedAt), gt(deviceEnrollmentGrants.expiresAt, new Date()))).limit(1);
  if (!candidate) return null;
  const [device] = await database.select({ id: devices.id }).from(devices).where(and(eq(devices.id, candidate.deviceId), eq(devices.userId, userId), eq(devices.ownershipStatus, "owned"), isNull(devices.revokedAt))).limit(1);
  if (!device) return null;
  const grant = enrollmentGrant(candidate.id, candidate.challengeHash);
  const [updated] = await database.update(deviceEnrollmentGrants).set({ userId, grantHash: hash(grant), approvedAt: new Date() }).where(and(eq(deviceEnrollmentGrants.id, challengeId), isNull(deviceEnrollmentGrants.approvedAt), isNull(deviceEnrollmentGrants.consumedAt), gt(deviceEnrollmentGrants.expiresAt, new Date()))).returning({ id: deviceEnrollmentGrants.id });
  return updated ? { approved: true } : null;
}

export async function getDeviceEnrollmentGrant(challengeId: string, challenge: string) {
  const database = requireDatabase();
  const [row] = await database.select({ id: deviceEnrollmentGrants.id, challengeHash: deviceEnrollmentGrants.challengeHash, userId: deviceEnrollmentGrants.userId }).from(deviceEnrollmentGrants).where(and(eq(deviceEnrollmentGrants.id, challengeId), eq(deviceEnrollmentGrants.challengeHash, hash(challenge)), gt(deviceEnrollmentGrants.expiresAt, new Date()), isNotNull(deviceEnrollmentGrants.approvedAt), isNull(deviceEnrollmentGrants.consumedAt))).limit(1);
  return row?.challengeHash && row.userId ? { challengeId: row.id, grant: enrollmentGrant(row.id, row.challengeHash) } : null;
}

export async function stageDeviceEnrollment(challengeId: string, challenge: string, grant: string, credentialHash: string) {
  const database = requireDatabase();
  const [existing] = await database.select({ stagedCredentialHash: deviceEnrollmentGrants.stagedCredentialHash, consumedAt: deviceEnrollmentGrants.consumedAt, finalizedAt: deviceEnrollmentGrants.finalizedAt }).from(deviceEnrollmentGrants).where(and(eq(deviceEnrollmentGrants.id, challengeId), eq(deviceEnrollmentGrants.challengeHash, hash(challenge)), eq(deviceEnrollmentGrants.grantHash, hash(grant)))).limit(1);
  if (existing?.consumedAt && existing.finalizedAt && existing.stagedCredentialHash === credentialHash) return { staged: true, alreadyFinalized: true };
  const [row] = await database.update(deviceEnrollmentGrants).set({ stagedCredentialHash: credentialHash, stagedAt: new Date() }).where(and(eq(deviceEnrollmentGrants.id, challengeId), eq(deviceEnrollmentGrants.challengeHash, hash(challenge)), eq(deviceEnrollmentGrants.grantHash, hash(grant)), isNotNull(deviceEnrollmentGrants.approvedAt), isNull(deviceEnrollmentGrants.consumedAt), gt(deviceEnrollmentGrants.expiresAt, new Date()))).returning({ id: deviceEnrollmentGrants.id });
  return row ? { staged: true, alreadyFinalized: false } : null;
}

export async function finalizeDeviceEnrollment(challengeId: string, challenge: string, grant: string, credential: string) {
  const database = requireDatabase();
  const now = new Date();
  return database.transaction(async (tx) => {
    const credentialHash = hash(credential);
    const [row] = await tx.select({ id: deviceEnrollmentGrants.id, deviceId: deviceEnrollmentGrants.deviceId, userId: deviceEnrollmentGrants.userId, stagedCredentialHash: deviceEnrollmentGrants.stagedCredentialHash, consumedAt: deviceEnrollmentGrants.consumedAt, finalizedAt: deviceEnrollmentGrants.finalizedAt, expiresAt: deviceEnrollmentGrants.expiresAt }).from(deviceEnrollmentGrants).where(and(eq(deviceEnrollmentGrants.id, challengeId), eq(deviceEnrollmentGrants.challengeHash, hash(challenge)), eq(deviceEnrollmentGrants.grantHash, hash(grant)), isNotNull(deviceEnrollmentGrants.approvedAt))).for("update").limit(1);
    if (row?.consumedAt && row.finalizedAt && row.stagedCredentialHash === credentialHash) return { finalized: true, alreadyFinalized: true, deviceId: row.deviceId };
    if (!row?.userId || !row.stagedCredentialHash || row.stagedCredentialHash !== credentialHash || row.consumedAt || row.finalizedAt || !row.id || row.expiresAt <= now) return null;
    const [device] = await tx.select({ id: devices.id, publicNumber: devices.publicNumber }).from(devices).where(and(eq(devices.id, row.deviceId), eq(devices.userId, row.userId), eq(devices.ownershipStatus, "owned"), isNull(devices.revokedAt))).limit(1);
    if (!device) return null;
    await tx.update(devices).set({ credentialHash, credentialRevokedAt: null, lastSeenAt: now }).where(eq(devices.id, device.id));
    await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.deviceId, device.id), isNull(sessions.revokedAt)));
    const [consumed] = await tx.update(deviceEnrollmentGrants).set({ consumedAt: now, finalizedAt: now }).where(and(eq(deviceEnrollmentGrants.id, row.id), isNull(deviceEnrollmentGrants.consumedAt))).returning({ id: deviceEnrollmentGrants.id });
    return consumed ? { finalized: true, alreadyFinalized: false, deviceId: device.id, deviceNumber: device.publicNumber } : null;
  });
}

export async function provisionDeviceCredential(userId: string, deviceId: string) {
  const database = requireDatabase();
  return database.transaction(async (tx) => {
    const [device] = await tx.select({ id: devices.id, publicNumber: devices.publicNumber, credentialHash: devices.credentialHash }).from(devices).where(and(eq(devices.id, deviceId), eq(devices.userId, userId), eq(devices.ownershipStatus, "owned"), isNull(devices.revokedAt))).for("update").limit(1);
    if (!device) return null;
    if (device.credentialHash) return { deviceId: device.id, deviceNumber: device.publicNumber, provisioned: false as const };
    const credential = newDeviceCredential();
    await tx.update(devices).set({ credentialHash: hash(credential), credentialRevokedAt: null, lastSeenAt: new Date() }).where(and(eq(devices.id, device.id), isNull(devices.credentialHash)));
    return { deviceId: device.id, deviceNumber: device.publicNumber, credential, provisioned: true as const };
  });
}

async function createDeviceSession(userId: string, deviceId: string, bootId: string, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const database = requireDatabase();
  await database.insert(sessions).values({ id: `session_${randomUUID()}`, userId, sessionTokenHash: hashSessionToken(token), expiresAt, sessionType: "device", deviceId, authenticatedBootId: bootId, userAgent: userAgent ?? "Cosmic Display" });
  return { token, expiresAt: expiresAt.toISOString(), deviceId };
}

export async function resetDeviceWithCredential(credential: string) {
  const database = requireDatabase();
  return database.transaction(async (tx) => {
    const [device] = await tx.select({ id: devices.id, publicNumber: devices.publicNumber }).from(devices).where(and(eq(devices.credentialHash, hash(credential)), eq(devices.ownershipStatus, "owned"), isNull(devices.credentialRevokedAt), isNull(devices.revokedAt))).for("update").limit(1);
    if (!device) return null;
    const nextCredential = newDeviceCredential();
    const now = new Date();
    await tx.update(devices).set({ userId: null, ownershipStatus: "unclaimed", credentialHash: hash(nextCredential), credentialRevokedAt: null, revokedAt: null, lastSeenAt: now }).where(eq(devices.id, device.id));
    await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.deviceId, device.id), isNull(sessions.revokedAt)));
    await tx.delete(kioskDeviceSettings).where(eq(kioskDeviceSettings.deviceId, device.id));
    return { deviceId: device.id, deviceNumber: device.publicNumber, credential: nextCredential };
  });
}
