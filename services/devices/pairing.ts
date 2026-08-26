import "server-only";

import { createHash, randomBytes, randomUUID } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { devices, devicePairings, sessions } from "@/services/database/schema";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { hashSessionToken } from "@/services/auth/localStore";

export const DEVICE_PAIRING_TTL_MS = 10 * 60 * 1000;
export const DEVICE_POLL_INTERVAL_SECONDS = 4;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function normalizeUserCode(value: string) { return value.replace(/[^A-Z0-9]/gi, "").toUpperCase(); }
function formatUserCode(value: string) { return `${value.slice(0, 4)}-${value.slice(4)}`; }
function randomUserCode() { return Array.from({ length: 6 }, () => ALPHABET[randomBytes(1)[0] % ALPHABET.length]).join(""); }
function requireDatabase() { if (!isDatabaseConfigured()) throw new Error("Device pairing requires durable PostgreSQL storage."); return getDatabase(); }

export async function createDevicePairing() {
  const database = requireDatabase();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const deviceCode = randomBytes(32).toString("base64url");
    const userCode = randomUserCode();
    try {
      const [row] = await database.insert(devicePairings).values({ id: `pair_${randomUUID()}`, deviceCodeHash: hash(deviceCode), userCode, expiresAt: new Date(Date.now() + DEVICE_PAIRING_TTL_MS), deviceType: "display" }).returning({ id: devicePairings.id, userCode: devicePairings.userCode, expiresAt: devicePairings.expiresAt });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://cosmicpudge.shop";
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
  return { status: row.status === "approved" ? "approved" as const : row.status === "denied" ? "denied" as const : row.status === "consumed" ? "expired" as const : "pending" as const };
}

export async function approveDevicePairing(userCodeInput: string, userId: string) {
  const database = requireDatabase();
  const userCode = normalizeUserCode(userCodeInput);
  if (userCode.length !== 6) return false;
  const [row] = await database.select({ id: devicePairings.id }).from(devicePairings).where(and(eq(devicePairings.userCode, userCode), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).limit(1);
  if (!row) return false;
  const updated = await database.update(devicePairings).set({ status: "approved", userId, approvedAt: new Date(), deviceName: "Cosmic Display" }).where(and(eq(devicePairings.id, row.id), eq(devicePairings.status, "pending"), gt(devicePairings.expiresAt, new Date()))).returning({ id: devicePairings.id });
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
  const result = await database.transaction(async (tx) => {
    const [pairing] = await tx.update(devicePairings).set({ status: "consumed", consumedAt: new Date() }).where(and(eq(devicePairings.deviceCodeHash, hash(deviceCode)), eq(devicePairings.status, "approved"), isNull(devicePairings.consumedAt))).returning();
    if (!pairing?.userId) return null;
    const [device] = await tx.insert(devices).values({ id: `device_${randomUUID()}`, userId: pairing.userId, name: pairing.deviceName ?? "Cosmic Display", type: pairing.deviceType }).returning({ id: devices.id });
    await tx.insert(sessions).values({ id: `session_${randomUUID()}`, userId: pairing.userId, sessionTokenHash: hashSessionToken(token), expiresAt, sessionType: "device", deviceId: device.id, userAgent: "Cosmic Display" });
    return { token, expiresAt: expiresAt.toISOString() };
  });
  return result;
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
