import "server-only";

import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getFinanceConnection, getFinanceCredential, getFinanceSyncState, applyProviderTransactions, saveProviderAccounts, setFinanceConnectionStatus, updateFinanceSyncState } from "./connectedStore";
import { getFinancialProviderRegistry } from "./providers/registry";
import { getDatabase } from "@/services/database/client";
import { financeExternalTransactions, financeTransferPairs } from "@/services/database/schema";
import { detectTransferPairs, type ConnectedFinanceTransaction } from "./merged";

export function financeProviderErrorCategory(error: unknown) { const name = error instanceof Error ? error.name : ""; if (name.includes("ITEM_LOGIN_REQUIRED")) return "reconnect_required"; if (name.includes("PRODUCT_NOT_READY")) return "sync_delayed"; if (name.includes("RATE_LIMIT")) return "rate_limited"; if (name.toLowerCase().includes("timeout")) return "provider_timeout"; if (name.includes("configuration")) return "provider_configuration"; return "provider_unavailable"; }

async function persistTransferPairs(userId: string) {
  const database = getDatabase();
  const transactions = await database.select({ id: financeExternalTransactions.id, externalAccountId: financeExternalTransactions.externalAccountId, postedDate: financeExternalTransactions.postedDate, amountMinor: financeExternalTransactions.amountMinor, direction: financeExternalTransactions.direction, description: financeExternalTransactions.description, merchant: financeExternalTransactions.merchant, status: financeExternalTransactions.status, providerCategory: financeExternalTransactions.providerCategory, removed: financeExternalTransactions.removed }).from(financeExternalTransactions).where(eq(financeExternalTransactions.userId, userId));
  const pairs = detectTransferPairs(transactions.map((item) => ({ ...item, date: item.postedDate, source: "connected" as const, ignored: item.removed })) as ConnectedFinanceTransaction[]);
  if (pairs.length) {
    await database.insert(financeTransferPairs).values(pairs.map((pair) => ({ id: randomUUID(), userId, sourceExternalTransactionId: pair.sourceId, destinationExternalTransactionId: pair.destinationId, confidence: pair.confidence, confirmed: false }))).onConflictDoNothing();
    for (const pair of pairs) await database.update(financeExternalTransactions).set({ direction: "transfer", updatedAt: new Date() }).where(eq(financeExternalTransactions.id, pair.sourceId)).then(() => database.update(financeExternalTransactions).set({ direction: "transfer", updatedAt: new Date() }).where(eq(financeExternalTransactions.id, pair.destinationId)));
  }
}

export async function syncFinanceConnection(userId: string, connectionId: string, force = false) {
  const connection = await getFinanceConnection(userId, connectionId);
  if (!connection) throw new Error("Finance connection not found.");
  if (connection.errorCategory === "plus_required") { const error = new Error("Cosmic+ is required for this connection."); error.name = "FINANCE_CONNECTION_LIMIT"; throw error; }
  const state = await getFinanceSyncState(connectionId);
  if (!force && state?.nextAllowedAt && state.nextAllowedAt.getTime() > Date.now()) { const error = new Error("This connection was synced recently."); error.name = "RATE_LIMIT"; throw error; }
  const credential = await getFinanceCredential(userId, connectionId);
  if (!credential?.accessToken) { const error = new Error("This connection needs to be reconnected."); error.name = "ITEM_LOGIN_REQUIRED"; throw error; }
  const provider = getFinancialProviderRegistry().find((item) => item.id === connection.provider)?.adapter;
  if (!provider) { const error = new Error("This Finance provider is not configured."); error.name = "configuration"; throw error; }
  await setFinanceConnectionStatus(userId, connectionId, { status: "syncing", lastAttemptedSyncAt: new Date(), errorCategory: null });
  await updateFinanceSyncState(connectionId, { lastAttemptedAt: new Date(), nextAllowedAt: new Date(Date.now() + 60_000), errorCategory: null });
  await saveProviderAccounts(userId, connectionId, await provider.getAccounts(credential.accessToken));
  let cursor = state?.cursor ?? undefined; let pageCount = 0; let added = 0; let modified = 0; let removed = 0; let result: Awaited<ReturnType<typeof provider.syncTransactions>>;
  do { result = await provider.syncTransactions(credential.accessToken, cursor); await applyProviderTransactions(userId, connectionId, result); added += result.added.length; modified += result.modified.length; removed += result.removedProviderTransactionIds.length; cursor = result.nextCursor; pageCount += 1; } while (result.hasMore && pageCount < 20);
  await persistTransferPairs(userId);
  await updateFinanceSyncState(connectionId, { cursor: cursor ?? null, initialSyncComplete: true, historicalSyncComplete: !result.hasMore, lastSuccessfulAt: new Date(), nextAllowedAt: new Date(Date.now() + 15 * 60_000), errorCategory: null });
  await setFinanceConnectionStatus(userId, connectionId, { status: "up_to_date", reconnectRequired: false, lastSuccessfulSyncAt: new Date(), errorCategory: null });
  return { status: "up_to_date", added, modified, removed, initialSyncComplete: true, historicalSyncComplete: !result.hasMore };
}
