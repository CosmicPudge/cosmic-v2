import "server-only";

import { and, asc, count, eq, inArray, isNull, lte, lt, ne, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { financeConnections, financeDuplicateDecisions, financeExternalAccounts, financeExternalTransactions, financeGoalContributions, financeSyncJobs, financeSyncState, financeTransferPairs, providerConnections } from "@/services/database/schema";
import { getDatabase } from "@/services/database/client";
import { deleteProviderConnectionCredentials, getProviderCredentials, setProviderCredentials } from "@/services/providers/store";
import type { FinancialProviderEnvironment, ProviderAccount, ProviderTransaction } from "./providers/types";
import { getPlaidFinancialProvider } from "./providers/plaid";
import { getAccountEntitlements } from "@/services/entitlements/service";

export type PlaidCredential = { accessToken: string; providerConnectionId: string };

export class FinanceConnectionLimitError extends Error { readonly code = "FINANCE_CONNECTION_LIMIT"; constructor(readonly limit: number) { super("Cosmic+ is required to connect multiple financial institutions."); this.name = "FinanceConnectionLimitError"; } }

const activeConnectionWhere = (userId: string) => and(eq(financeConnections.userId, userId), ne(financeConnections.status, "disconnected"), ne(financeConnections.errorCategory, "plus_required"));

export async function getActiveFinanceConnectionCount(userId: string, database = getDatabase()) {
  const rows = await database.select({ value: count() }).from(financeConnections).where(activeConnectionWhere(userId));
  return Number(rows[0]?.value ?? 0);
}

export async function getFinanceConnectionLimit(userId: string) {
  const entitlements = await getAccountEntitlements(userId);
  return entitlements.limits["finance.connectedInstitutions"] ?? 1;
}

export async function canAddFinanceConnection(userId: string, existingConnectionId?: string) {
  if (existingConnectionId) {
    const existing = await getFinanceConnection(userId, existingConnectionId);
    if (existing) return { allowed: true, count: await getActiveFinanceConnectionCount(userId), limit: await getFinanceConnectionLimit(userId), reconnect: true };
  }
  const [countValue, limit] = await Promise.all([getActiveFinanceConnectionCount(userId), getFinanceConnectionLimit(userId)]);
  return { allowed: countValue < limit, count: countValue, limit, reconnect: false };
}

export async function reconcileFinanceConnectionEntitlements(userId: string) {
  const [connections, limit] = await Promise.all([listFinanceConnections(userId), getFinanceConnectionLimit(userId)]);
  if (limit > 1) {
    for (const connection of connections.filter((item) => item.errorCategory === "plus_required")) await setFinanceConnectionStatus(userId, connection.id, { status: "connected", reconnectRequired: false, errorCategory: null });
  }
  const active = connections.filter((connection) => connection.status !== "disconnected" && connection.errorCategory !== "plus_required").sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const extras = active.slice(limit);
  for (const connection of extras) {
    await cancelFinanceSyncJobs(userId, connection.id);
    await setFinanceConnectionStatus(userId, connection.id, { status: "provider_unavailable", reconnectRequired: false, errorCategory: "plus_required" });
  }
  return { count: active.length - extras.length, limit, paused: extras.length, pausedConnectionIds: extras.map((connection) => connection.id) };
}

export async function assertFinanceConnectionAllowed(userId: string, existingConnectionId?: string) {
  const result = await canAddFinanceConnection(userId, existingConnectionId);
  if (!result.allowed) throw new FinanceConnectionLimitError(result.limit);
  return result;
}

export async function createFinanceConnection(userId: string, input: { environment: FinancialProviderEnvironment; providerConnectionId: string; institutionId?: string; institutionName?: string; accessToken: string; existingConnectionId?: string }) {
  const database = getDatabase();
  const rows = await database.transaction(async (transaction) => {
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    let providerId: string | undefined;
    if (input.existingConnectionId) {
      const owned = await transaction.select({ id: financeConnections.id }).from(financeConnections).where(and(eq(financeConnections.id, input.existingConnectionId), eq(financeConnections.userId, userId))).limit(1);
      providerId = owned[0]?.id;
    }
    if (!providerId) {
      const existing = await transaction.select({ id: providerConnections.id }).from(providerConnections).where(and(eq(providerConnections.userId, userId), eq(providerConnections.provider, "plaid"), eq(providerConnections.providerAccountId, input.providerConnectionId))).limit(1);
      providerId = existing[0]?.id;
    }
    if (!providerId) {
      const activeRows = await transaction.select({ value: count() }).from(financeConnections).where(activeConnectionWhere(userId));
      const activeCount = Number(activeRows[0]?.value ?? 0);
      const limit = await getFinanceConnectionLimit(userId);
      if (activeCount >= limit) throw new FinanceConnectionLimitError(limit);
      providerId = randomUUID();
    }
    await transaction.insert(providerConnections).values({ id: providerId, userId, provider: "plaid", providerType: "financial-aggregation", providerAccountId: input.providerConnectionId, displayName: input.institutionName ?? "Connected institution" }).onConflictDoUpdate({ target: providerConnections.id, set: { providerAccountId: input.providerConnectionId, displayName: input.institutionName ?? "Connected institution", updatedAt: new Date(), status: "connected", reconnectRequired: false } });
    return transaction.insert(financeConnections).values({ id: providerId, userId, provider: "plaid", environment: input.environment, institutionId: input.institutionId, institutionName: input.institutionName, status: "connected" }).onConflictDoUpdate({ target: financeConnections.id, set: { environment: input.environment, institutionId: input.institutionId, institutionName: input.institutionName, status: "connected", reconnectRequired: false, errorCategory: null, updatedAt: new Date() } }).returning();
  });
  await setProviderCredentials(userId, rows[0].id, { accessToken: input.accessToken, providerConnectionId: input.providerConnectionId });
  await getDatabase().insert(financeSyncState).values({ connectionId: rows[0].id }).onConflictDoNothing();
  return rows[0];
}

export async function getFinanceConnection(userId: string, id: string) {
  const rows = await getDatabase().select().from(financeConnections).where(and(eq(financeConnections.userId, userId), eq(financeConnections.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function listFinanceConnections(userId: string) {
  return getDatabase().select().from(financeConnections).where(eq(financeConnections.userId, userId));
}

export async function getFinanceConnectionByProviderId(provider: string, providerConnectionId: string) {
  const rows = await getDatabase().select({ finance: financeConnections }).from(financeConnections).innerJoin(providerConnections, eq(financeConnections.id, providerConnections.id)).where(and(eq(financeConnections.provider, provider), eq(providerConnections.providerAccountId, providerConnectionId))).limit(1);
  return rows[0]?.finance ?? null;
}

export async function getFinanceCredential(userId: string, connectionId: string) {
  return getProviderCredentials<PlaidCredential>(userId, connectionId);
}

export async function saveProviderAccounts(userId: string, connectionId: string, accounts: ProviderAccount[]) {
  const database = getDatabase();
  for (const account of accounts) {
    const existing = await database.select({ id: financeExternalAccounts.id }).from(financeExternalAccounts).where(and(eq(financeExternalAccounts.userId, userId), eq(financeExternalAccounts.connectionId, connectionId), eq(financeExternalAccounts.providerAccountId, account.providerAccountId))).limit(1);
    const values = { userId, connectionId, providerAccountId: account.providerAccountId, name: account.name, type: account.type, subtype: account.subtype, mask: account.mask, currency: account.currency, currentBalanceMinor: account.currentBalanceMinor, availableBalanceMinor: account.availableBalanceMinor, creditLimitMinor: account.creditLimitMinor, status: "connected", lastUpdatedAt: new Date(), updatedAt: new Date() };
    if (existing[0]) await database.update(financeExternalAccounts).set(values).where(eq(financeExternalAccounts.id, existing[0].id));
    else await database.insert(financeExternalAccounts).values({ id: randomUUID(), ...values });
  }
}

export async function applyProviderTransactions(userId: string, connectionId: string, changes: { added: ProviderTransaction[]; modified: ProviderTransaction[]; removedProviderTransactionIds: string[] }) {
  const database = getDatabase();
  const all = [...changes.added, ...changes.modified];
  for (const transaction of all) {
    const account = await database.select({ id: financeExternalAccounts.id }).from(financeExternalAccounts).where(and(eq(financeExternalAccounts.userId, userId), eq(financeExternalAccounts.connectionId, connectionId), eq(financeExternalAccounts.providerAccountId, transaction.providerAccountId))).limit(1);
    if (!account[0]) continue;
    const existing = await database.select({ id: financeExternalTransactions.id }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.userId, userId), eq(financeExternalTransactions.connectionId, connectionId), eq(financeExternalTransactions.providerTransactionId, transaction.providerTransactionId))).limit(1);
    const values = { userId, connectionId, externalAccountId: account[0].id, providerTransactionId: transaction.providerTransactionId, pendingProviderTransactionId: transaction.pendingProviderTransactionId, postedDate: transaction.postedDate, authorizedDate: transaction.authorizedDate, description: transaction.description, merchant: transaction.merchant, amountMinor: transaction.amountMinor, direction: transaction.direction, status: transaction.status, providerCategory: transaction.providerCategory, paymentChannel: transaction.paymentChannel, currency: transaction.currency, removed: false, syncedAt: new Date(), updatedAt: new Date() };
    if (existing[0]) await database.update(financeExternalTransactions).set(values).where(eq(financeExternalTransactions.id, existing[0].id));
    else await database.insert(financeExternalTransactions).values({ id: randomUUID(), ...values });
  }
  for (const providerTransactionId of changes.removedProviderTransactionIds) await database.update(financeExternalTransactions).set({ removed: true, updatedAt: new Date() }).where(and(eq(financeExternalTransactions.userId, userId), eq(financeExternalTransactions.connectionId, connectionId), eq(financeExternalTransactions.providerTransactionId, providerTransactionId)));
}

export async function getFinanceSyncState(connectionId: string) {
  const rows = await getDatabase().select().from(financeSyncState).where(eq(financeSyncState.connectionId, connectionId)).limit(1);
  return rows[0] ?? null;
}

export async function updateFinanceSyncState(connectionId: string, values: Partial<typeof financeSyncState.$inferInsert>) {
  await getDatabase().update(financeSyncState).set({ ...values, updatedAt: new Date() }).where(eq(financeSyncState.connectionId, connectionId));
}

export async function setFinanceConnectionStatus(userId: string, connectionId: string, values: Partial<typeof financeConnections.$inferInsert>) {
  await getDatabase().update(financeConnections).set({ ...values, updatedAt: new Date() }).where(and(eq(financeConnections.userId, userId), eq(financeConnections.id, connectionId)));
}

export async function deleteFinanceConnection(userId: string, connectionId: string) {
  const connection = await getFinanceConnection(userId, connectionId);
  if (!connection) return false;
  await cancelFinanceSyncJobs(userId, connectionId);
  await getDatabase().update(financeConnections).set({ status: "disconnected", reconnectRequired: false, updatedAt: new Date() }).where(and(eq(financeConnections.userId, userId), eq(financeConnections.id, connectionId)));
  return deleteProviderConnectionCredentials(userId, connectionId);
}

export async function deleteFinanceConnectionData(userId: string, connectionId: string) {
  const database = getDatabase();
  const connection = await getFinanceConnection(userId, connectionId);
  if (!connection) return false;
  const transactions = await database.select({ id: financeExternalTransactions.id }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.userId, userId), eq(financeExternalTransactions.connectionId, connectionId)));
  const transactionIds = transactions.map((item) => item.id);
  await cancelFinanceSyncJobs(userId, connectionId);
  if (transactionIds.length) {
    await database.delete(financeTransferPairs).where(and(eq(financeTransferPairs.userId, userId), or(...transactionIds.map((id) => eq(financeTransferPairs.sourceExternalTransactionId, id)), ...transactionIds.map((id) => eq(financeTransferPairs.destinationExternalTransactionId, id)))));
    await database.delete(financeDuplicateDecisions).where(and(eq(financeDuplicateDecisions.userId, userId), or(...transactionIds.map((id) => eq(financeDuplicateDecisions.sourceExternalTransactionId, id)), ...transactionIds.map((id) => eq(financeDuplicateDecisions.duplicateExternalTransactionId, id)))));
    await database.delete(financeGoalContributions).where(and(eq(financeGoalContributions.userId, userId), or(...transactionIds.map((id) => eq(financeGoalContributions.externalTransactionId, id)))));
  }
  await database.delete(financeConnections).where(and(eq(financeConnections.userId, userId), eq(financeConnections.id, connectionId)));
  return true;
}

export async function revokeFinanceConnectionsForAccount(userId: string) {
  const connections = await listFinanceConnections(userId);
  const failures: string[] = [];
  for (const connection of connections) {
    const credential = await getFinanceCredential(userId, connection.id);
    try {
      if (connection.provider === "plaid" && credential?.accessToken) await getPlaidFinancialProvider().disconnect(credential.accessToken);
    } catch { failures.push(connection.id); }
  }
  return { attempted: connections.length, failures };
}

export async function enqueueFinanceSyncJob(userId: string, connectionId: string, reason: string) {
  const database = getDatabase();
  const existing = await database.select({ id: financeSyncJobs.id }).from(financeSyncJobs).where(and(eq(financeSyncJobs.userId, userId), eq(financeSyncJobs.connectionId, connectionId), inArray(financeSyncJobs.status, ["queued", "processing", "retry"]))).limit(1);
  if (existing[0]) return existing[0].id;
  const [job] = await database.insert(financeSyncJobs).values({ id: randomUUID(), userId, connectionId, reason, status: "queued" }).returning({ id: financeSyncJobs.id });
  return job.id;
}

export async function listClaimableFinanceSyncJobs(limit: number, now = new Date()) {
  const database = getDatabase();
  return database.select().from(financeSyncJobs).where(or(eq(financeSyncJobs.status, "queued"), and(eq(financeSyncJobs.status, "retry"), or(isNull(financeSyncJobs.nextAttemptAt), lte(financeSyncJobs.nextAttemptAt, now))), and(eq(financeSyncJobs.status, "processing"), lt(financeSyncJobs.leaseExpiresAt, now)))).orderBy(asc(financeSyncJobs.createdAt)).limit(Math.min(10, Math.max(1, limit)));
}

export async function claimFinanceSyncJob(jobId: string, now = new Date(), leaseMs = 120_000) {
  const database = getDatabase(); const leaseExpiresAt = new Date(now.getTime() + leaseMs);
  const rows = await database.update(financeSyncJobs).set({ status: "processing", attempts: sql`${financeSyncJobs.attempts} + 1`, attemptedAt: now, startedAt: now, leaseExpiresAt, lastErrorCategory: null }).where(and(eq(financeSyncJobs.id, jobId), or(eq(financeSyncJobs.status, "queued"), and(eq(financeSyncJobs.status, "retry"), or(isNull(financeSyncJobs.nextAttemptAt), lte(financeSyncJobs.nextAttemptAt, now))), and(eq(financeSyncJobs.status, "processing"), lt(financeSyncJobs.leaseExpiresAt, now))))).returning();
  return rows[0] ?? null;
}

export async function completeFinanceSyncJob(jobId: string, now = new Date()) { await getDatabase().update(financeSyncJobs).set({ status: "completed", completedAt: now, leaseExpiresAt: null, nextAttemptAt: null }).where(and(eq(financeSyncJobs.id, jobId), eq(financeSyncJobs.status, "processing"))); }
export async function failFinanceSyncJob(jobId: string, errorCategory: string, retry: boolean, nextAttemptAt?: Date, now = new Date()) { await getDatabase().update(financeSyncJobs).set({ status: retry ? "retry" : "failed", lastErrorCategory: errorCategory, nextAttemptAt: retry ? nextAttemptAt ?? now : null, leaseExpiresAt: null, completedAt: retry ? null : now }).where(and(eq(financeSyncJobs.id, jobId), eq(financeSyncJobs.status, "processing"))); }
export async function cancelFinanceSyncJobs(userId: string, connectionId: string) { await getDatabase().update(financeSyncJobs).set({ status: "cancelled", completedAt: new Date(), leaseExpiresAt: null }).where(and(eq(financeSyncJobs.userId, userId), eq(financeSyncJobs.connectionId, connectionId), inArray(financeSyncJobs.status, ["queued", "retry", "processing"]))); }
export async function getFinanceSyncJobCounts(userId: string) { const database = getDatabase(); return database.select({ status: financeSyncJobs.status, count: sql<number>`count(*)` }).from(financeSyncJobs).where(eq(financeSyncJobs.userId, userId)).groupBy(financeSyncJobs.status); }
