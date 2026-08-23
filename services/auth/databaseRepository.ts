import "server-only";

import { randomUUID } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import type { AuthRepository, AuthSessionRecord, AuthUserRecord } from "./contracts";
import { sessions, users } from "@/services/database/schema";
import { getAccountAccessState } from "./access";

function account(row: typeof users.$inferSelect): AuthUserRecord {
  return { id: row.id, email: row.email, ...(row.displayName ? { displayName: row.displayName } : {}), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), passwordHash: row.passwordHash, passwordSalt: row.passwordSalt, status: row.status === "disabled" ? "disabled" : "active" };
}

function session(row: typeof sessions.$inferSelect, user: typeof users.$inferSelect): AuthSessionRecord {
  return { account: account(user), sessionId: row.id, expiresAt: row.expiresAt.toISOString(), createdAt: row.createdAt.toISOString(), lastUsedAt: row.lastUsedAt.toISOString(), ...(row.userAgent ? { userAgent: row.userAgent } : {}) };
}

async function findUser(idOrEmail: { id: string } | { normalizedEmail: string }) {
  const [row] = await getDatabase().select().from(users).where("id" in idOrEmail ? eq(users.id, idOrEmail.id) : eq(users.normalizedEmail, idOrEmail.normalizedEmail)).limit(1);
  return row ?? null;
}

export const databaseAuthRepository: AuthRepository = {
  async findUserByEmail(email) { const row = await findUser({ normalizedEmail: email }); return row ? account(row) : null; },
  async findUserById(id) { const row = await findUser({ id }); return row ? account(row) : null; },
  async createUser(input) { const [row] = await getDatabase().insert(users).values({ id: input.id, email: input.email, normalizedEmail: input.email, displayName: input.displayName ?? null, passwordHash: input.passwordHash, passwordSalt: input.passwordSalt }).returning(); return account(row); },
  async createSession(input) { const [row] = await getDatabase().insert(sessions).values({ id: `session_${randomUUID()}`, userId: input.userId, sessionTokenHash: input.tokenHash, expiresAt: new Date(input.expiresAt), ...(input.userAgent ? { userAgent: input.userAgent } : {}) }).returning(); const user = await findUser({ id: row.userId }); if (!user) throw new Error("Account not found."); return session(row, user); },
  async findSession(tokenHash) { const result = await getDatabase().select().from(sessions).innerJoin(users, eq(sessions.userId, users.id)).where(and(eq(sessions.sessionTokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).limit(1); const row = result[0]; if (!row || row.users.status === "disabled" || (await getAccountAccessState(row.users.id)).status !== "active") return null; const lastUsedAt = new Date(); await getDatabase().update(sessions).set({ lastUsedAt }).where(eq(sessions.id, row.sessions.id)); return session({ ...row.sessions, lastUsedAt }, row.users); },
  async revokeSession(tokenHash) { await getDatabase().update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.sessionTokenHash, tokenHash), isNull(sessions.revokedAt))); },
  async revokeAllSessions(userId) { await getDatabase().update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt))); },
  async deleteUser(userId) { await getDatabase().delete(users).where(eq(users.id, userId)); },
};
