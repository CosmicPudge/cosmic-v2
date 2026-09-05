import "server-only";

import { and, count, desc, eq, gt, ilike, isNull, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { accountModeration, accountRoles, adminAuditLog, adminEntitlementOverrides, providerConnections, sessions, users } from "@/services/database/schema";
import { getDatabase } from "@/services/database/client";
import { getBillingSubscription } from "@/services/billing/repository";
import { getAuthRepository } from "@/services/auth/repository";
import { cancelSubscriptionForAccountDeletion } from "@/services/billing/stripe";
import type { CosmicPlan } from "@/core/contracts/Entitlements";

export type AdminAction = "entitlement.force_plus" | "entitlement.force_free" | "entitlement.reset" | "session.revoke_all" | "password.force_reset" | "account.suspend" | "account.ban" | "account.unban" | "account.delete" | "role.change" | `support.${string}`;
export type AdminMetadata = Record<string, string | number | boolean | null>;

export async function searchAccounts(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return getDatabase().select({ id: users.id, email: users.email, displayName: users.displayName, status: users.status, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(or(eq(users.id, needle), ilike(users.normalizedEmail, `%${needle}%`))).orderBy(desc(users.createdAt)).limit(25);
}

export async function getAdminAccount(accountId: string) {
  const database = getDatabase();
  const rows = await database.select({ id: users.id, email: users.email, displayName: users.displayName, status: users.status, createdAt: users.createdAt, updatedAt: users.updatedAt }).from(users).where(eq(users.id, accountId)).limit(1);
  const user = rows[0];
  if (!user) return null;
  const [billing, override, moderation, roleRows, sessionRows, connectionRows] = await Promise.all([getBillingSubscription(accountId), database.select().from(adminEntitlementOverrides).where(eq(adminEntitlementOverrides.accountId, accountId)).limit(1), database.select().from(accountModeration).where(eq(accountModeration.accountId, accountId)).limit(1), database.select({ role: accountRoles.role }).from(accountRoles).where(eq(accountRoles.accountId, accountId)), database.select({ id: sessions.id }).from(sessions).where(and(eq(sessions.userId, accountId), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))), database.select({ id: providerConnections.id }).from(providerConnections).where(eq(providerConnections.userId, accountId))]);
  return { user, billing: billing ? { plan: billing.status === "active" || billing.status === "trialing" || billing.status === "past_due" ? "cosmic_plus" : "free", status: billing.status, currentPeriodEnd: billing.currentPeriodEnd?.toISOString() ?? null } : { plan: "free", status: "inactive", currentPeriodEnd: null }, override: override[0] ? { plan: override[0].plan, expiresAt: override[0].expiresAt?.toISOString() ?? null, createdAt: override[0].createdAt.toISOString() } : null, moderation: moderation[0] ? { status: moderation[0].status, expiresAt: moderation[0].expiresAt?.toISOString() ?? null } : { status: "active", expiresAt: null }, roles: roleRows.map((item) => item.role), activeSessionCount: sessionRows.length, providerConnectionCount: connectionRows.length };
}

export async function setEntitlementOverride(accountId: string, plan: CosmicPlan | null, expiresAt: Date | null, actorAccountId: string) {
  const database = getDatabase();
  if (!plan) { await database.delete(adminEntitlementOverrides).where(eq(adminEntitlementOverrides.accountId, accountId)); return; }
  await database.insert(adminEntitlementOverrides).values({ accountId, plan, expiresAt, createdBy: actorAccountId, updatedAt: new Date() }).onConflictDoUpdate({ target: adminEntitlementOverrides.accountId, set: { plan, expiresAt, updatedAt: new Date(), createdBy: actorAccountId } });
}

export async function revokeAllSessions(accountId: string) { await getAuthRepository().revokeAllSessions(accountId); }

export async function setModeration(accountId: string, status: "suspended" | "banned", expiresAt: Date | null, reason: string, internalNote: string | undefined, actorAccountId: string) {
  const database = getDatabase();
  await database.insert(accountModeration).values({ accountId, status, expiresAt, reason, internalNote: internalNote ?? null, createdBy: actorAccountId, updatedAt: new Date() }).onConflictDoUpdate({ target: accountModeration.accountId, set: { status, expiresAt, reason, internalNote: internalNote ?? null, createdBy: actorAccountId, updatedAt: new Date() } });
  await revokeAllSessions(accountId);
}

export async function clearModeration(accountId: string) { await getDatabase().delete(accountModeration).where(eq(accountModeration.accountId, accountId)); }

export async function countAdmins() { const rows = await getDatabase().select({ total: count() }).from(accountRoles).where(eq(accountRoles.role, "admin")); return Number(rows[0]?.total ?? 0); }

export async function deleteAccountSafely(accountId: string) { const account = await getAuthRepository().findUserById(accountId); if (!account) return false; await cancelSubscriptionForAccountDeletion(account); await getAuthRepository().revokeAllSessions(accountId); await getAuthRepository().deleteUser(accountId); return true; }

export async function recordAudit(actorAccountId: string, targetAccountId: string | undefined, action: AdminAction, metadata: AdminMetadata, correlationId?: string) { await getDatabase().insert(adminAuditLog).values({ id: `audit_${randomUUID()}`, actorAccountId, targetAccountId, action, metadata, correlationId: correlationId ?? null }); }

export async function listAudit(limit = 50) { return getDatabase().select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(Math.min(Math.max(limit, 1), 100)); }
