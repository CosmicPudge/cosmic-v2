import "server-only";

import { randomUUID } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import type { AccountIdentityRecord, AuthRepository, AuthSessionRecord, AuthUserRecord } from "./contracts";
import { accountIdentities, devices, sessions, users } from "@/services/database/schema";
import { getAccountAccessState } from "./access";
import { toPublicCosmicAccount } from "./serialization";

function account(row: typeof users.$inferSelect): AuthUserRecord {
  return { id: row.id, email: row.email, ...(row.displayName ? { displayName: row.displayName } : {}), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), passwordHash: row.passwordHash, passwordSalt: row.passwordSalt, status: row.status === "disabled" ? "disabled" : "active" };
}

function session(row: typeof sessions.$inferSelect, user: typeof users.$inferSelect): AuthSessionRecord {
  return { account: toPublicCosmicAccount(user), sessionId: row.id, expiresAt: row.expiresAt.toISOString(), createdAt: row.createdAt.toISOString(), lastUsedAt: row.lastUsedAt.toISOString(), sessionType: row.sessionType === "device" ? "device" : "user", ...(row.deviceId ? { deviceId: row.deviceId } : {}), ...(row.authenticatedBootId ? { authenticatedBootId: row.authenticatedBootId } : {}), ...(row.userAgent ? { userAgent: row.userAgent } : {}) };
}

async function findUser(idOrEmail: { id: string } | { normalizedEmail: string }) {
  const [row] = await getDatabase().select().from(users).where("id" in idOrEmail ? eq(users.id, idOrEmail.id) : eq(users.normalizedEmail, idOrEmail.normalizedEmail)).limit(1);
  return row ?? null;
}

export const databaseAuthRepository: AuthRepository = {
  async findUserByEmail(email) { const row = await findUser({ normalizedEmail: email }); return row ? account(row) : null; },
  async findUserById(id) { const row = await findUser({ id }); return row ? account(row) : null; },
  async createUser(input) { const [row] = await getDatabase().insert(users).values({ id: input.id, email: input.email, normalizedEmail: input.email, displayName: input.displayName ?? null, passwordHash: input.passwordHash ?? null, passwordSalt: input.passwordSalt ?? null }).returning(); if (input.passwordHash && input.passwordSalt) await getDatabase().insert(accountIdentities).values({ id: `identity_${randomUUID()}`, accountId: row.id, provider: "password", providerSubject: row.id, email: row.email }); return account(row); },
  async createSession(input) { const [row] = await getDatabase().insert(sessions).values({ id: `session_${randomUUID()}`, userId: input.userId, sessionTokenHash: input.tokenHash, expiresAt: new Date(input.expiresAt), sessionType: input.sessionType ?? "user", ...(input.deviceId ? { deviceId: input.deviceId } : {}), ...(input.authenticatedBootId ? { authenticatedBootId: input.authenticatedBootId } : {}), ...(input.userAgent ? { userAgent: input.userAgent } : {}) }).returning(); const user = await findUser({ id: row.userId }); if (!user) throw new Error("Account not found."); return session(row, user); },
  async findSession(tokenHash) { const result = await getDatabase().select().from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.sessionTokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).limit(1); const row = result[0]; if (!row || row.users.status === "disabled" || (await getAccountAccessState(row.users.id)).status !== "active") return null; if (row.sessions.deviceId) { const [device] = await getDatabase().select({ id: devices.id }).from(devices).where(and(eq(devices.id, row.sessions.deviceId), eq(devices.userId, row.users.id), isNull(devices.revokedAt))).limit(1); if (!device) return null; } const lastUsedAt = new Date(); await getDatabase().update(sessions).set({ lastUsedAt }).where(eq(sessions.id, row.sessions.id)); if (row.sessions.deviceId) await getDatabase().update(devices).set({ lastSeenAt: lastUsedAt }).where(eq(devices.id, row.sessions.deviceId)); return session({ ...row.sessions, lastUsedAt }, row.users); },
  async revokeSession(tokenHash) { await getDatabase().update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.sessionTokenHash, tokenHash), isNull(sessions.revokedAt))); },
  async revokeAllSessions(userId) { await getDatabase().update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt))); },
  async deleteUser(userId) { await getDatabase().delete(users).where(eq(users.id, userId)); },
  async listAccountIdentities(accountId) { const rows = await getDatabase().select().from(accountIdentities).where(eq(accountIdentities.accountId, accountId)); return rows.map(identity); },
  async findAccountIdentity(provider, providerSubject) { const [row] = await getDatabase().select().from(accountIdentities).where(and(eq(accountIdentities.provider, provider), eq(accountIdentities.providerSubject, providerSubject))).limit(1); return row ? identity(row) : null; },
  async createAccountIdentity(input) { const [row] = await getDatabase().insert(accountIdentities).values({ id: `identity_${randomUUID()}`, accountId: input.accountId, provider: input.provider, providerSubject: input.providerSubject, email: input.email ?? null }).returning(); return identity(row); },
  async touchAccountIdentity(id) { const [row] = await getDatabase().update(accountIdentities).set({ lastUsedAt: new Date() }).where(eq(accountIdentities.id, id)).returning(); return row ? identity(row) : null; },
  async deleteAccountIdentity(accountId, id) { const result = await getDatabase().delete(accountIdentities).where(and(eq(accountIdentities.accountId, accountId), eq(accountIdentities.id, id))).returning({ id: accountIdentities.id }); return result.length > 0; },
};

function identity(row: typeof accountIdentities.$inferSelect): AccountIdentityRecord { return { id: row.id, accountId: row.accountId, provider: row.provider as AccountIdentityRecord["provider"], providerSubject: row.providerSubject, email: row.email, createdAt: row.createdAt.toISOString(), lastUsedAt: row.lastUsedAt.toISOString() }; }
