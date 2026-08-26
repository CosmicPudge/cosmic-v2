import "server-only";

import { createHash, randomBytes, randomUUID } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { devices, devicePairings, sessions } from "@/services/database/schema";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { hashSessionToken } from "@/services/auth/localStore";

export const DEVICE_PAIRING_TTL_MS = 10 * 60 * 1000;
export const DEVICE_POLL_INTERVAL_SECONDS = 4;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pairLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[pair] ${message}`);
}

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function normalizeUserCode(value: string) { return value.replace(/[^A-Z0-9]/gi, "").toUpperCase(); }
function formatUserCode(value: string) { return `${value.slice(0, 4)}-${value.slice(4)}`; }
function randomUserCode() { return Array.from({ length: 6 }, () => ALPHABET[randomBytes(1)[0] % ALPHABET.length]).join(""); }
function requireDatabase() { if (!isDatabaseConfigured()) throw new Error("Device pairing requires durable PostgreSQL storage."); return getDatabase(); }
export function normalizeBootId(value: unknown) { return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null; }

export async function createDevicePairing(bootId: string, existingDeviceId?: string) {
  const database = requireDatabase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const deviceCode = randomBytes(32).toString("base64url");
    const userCode = randomUserCode();
    try {
      const [row] = await database.insert(devicePairings).values({ id: `pair_${randomUUID()}`, deviceCodeHash: hash(deviceCode), userCode, expiresAt: new Date(Date.now() + DEVICE_PAIRING_TTL_MS), deviceType: "display", bootId, ...(existingDeviceId ? { deviceId: existingDeviceId } : {}) }).returning({ id: devicePairings.id, userCode: devicePairings.userCode, expiresAt: devicePairings.expiresAt });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cosmicpudge.shop";
      pairLog(`created id=${row.id} status=pending boot=${bootId}`);
      return { deviceCode, userCode: formatUserCode(row.userCode), verificationUrl: `${baseUrl}/activate?code=${encodeURIComponent(formatUserCode(row.userCode))}`, expiresAt: row.expiresAt.toISOString(), pollInterval: DEVICE_POLL_INTERVAL_SECONDS };
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
  const [row] = await database.select({ id: devicePairings.id }).from(devicePairings).where(and(eq(devicePairings.userCode, userCode), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).limit(1);
  if (!row) return false;
  const updated = await database.update(devicePairings).set({ status: "approved", userId, approvedAt: new Date(), deviceName: "Cosmic Display" }).where(and(eq(devicePairings.id, row.id), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).returning({ id: devicePairings.id });
  if (updated[0]) pairLog(`approved id=${updated[0].id} status=approved`);
  return Boolean(updated[0]);
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
      const [existingDevice] = pairing.deviceId ? await tx.select({ id: devices.id }).from(devices).where(and(eq(devices.id, pairing.deviceId), eq(devices.userId, pairing.userId), isNull(devices.revokedAt))).limit(1) : [];
      const deviceId = existingDevice?.id ?? `device_${randomUUID()}`;
      if (existingDevice) await tx.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, deviceId));
      else await tx.insert(devices).values({ id: deviceId, userId: pairing.userId, name: pairing.deviceName ?? "Cosmic Display", type: pairing.deviceType });
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
      return { token, expiresAt: expiresAt.toISOString(), deviceId };
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
  return database.select({ id: devices.id, name: devices.name, type: devices.type, createdAt: devices.createdAt, lastSeenAt: devices.lastSeenAt, revokedAt: devices.revokedAt }).from(devices).where(eq(devices.userId, userId)).orderBy(devices.createdAt);
}

export async function revokeDevice(userId: string, deviceId: string) {
  const database = requireDatabase();
  const now = new Date();
  const updated = await database.update(devices).set({ revokedAt: now }).where(and(eq(devices.id, deviceId), eq(devices.userId, userId), isNull(devices.revokedAt))).returning({ id: devices.id });
  if (!updated[0]) return false;
  await database.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.deviceId, deviceId), isNull(sessions.revokedAt)));
  return true;
}
