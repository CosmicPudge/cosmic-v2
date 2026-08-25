import { and, count, eq, min } from "drizzle-orm";
import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured, getDatabase } from "@/services/database/client";
import { financeConnections, financeExternalAccounts, financeExternalTransactions, financeGoalContributions, financeSavingsGoals, financeSyncJobs, financeSyncState, financeTransactionOverrides, financeTransferPairs } from "@/services/database/schema";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { getFinancialProviderRegistry, publicProviderDescriptor } from "@/services/finance/providers/registry";
import { getAccountEntitlements } from "@/services/entitlements/service";
import { getActiveFinanceConnectionCount } from "@/services/finance/connectedStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    const providerRegistry = getFinancialProviderRegistry().map(publicProviderDescriptor);
    if (!isDatabaseConfigured()) return Response.json({ configured: false, providerConfigured: Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET), encryptionConfigured: isCredentialEncryptionConfigured(), providers: providerRegistry });
    const database = getDatabase();
    const [connections, accounts, transactions, sync, overrides, transfers, goals, contributions, queuedSyncJobs, syncJobs, moneyIn, moneyOut, transferCount, entitlements, activeConnectionCount] = await Promise.all([
      database.select({ value: count() }).from(financeConnections).where(eq(financeConnections.userId, account.id)),
      database.select({ value: count() }).from(financeExternalAccounts).where(eq(financeExternalAccounts.userId, account.id)),
      database.select({ value: count() }).from(financeExternalTransactions).where(eq(financeExternalTransactions.userId, account.id)),
      database.select({ value: count() }).from(financeSyncState).innerJoin(financeConnections, eq(financeSyncState.connectionId, financeConnections.id)).where(eq(financeConnections.userId, account.id)),
      database.select({ value: count() }).from(financeTransactionOverrides).where(eq(financeTransactionOverrides.userId, account.id)),
      database.select({ value: count() }).from(financeTransferPairs).where(eq(financeTransferPairs.userId, account.id)),
      database.select({ value: count() }).from(financeSavingsGoals).where(eq(financeSavingsGoals.userId, account.id)),
      database.select({ value: count() }).from(financeGoalContributions).where(eq(financeGoalContributions.userId, account.id)),
      database.select({ value: count() }).from(financeSyncJobs).where(eq(financeSyncJobs.userId, account.id)),
      database.select({ status: financeSyncJobs.status, count: count(), oldestCreatedAt: min(financeSyncJobs.createdAt) }).from(financeSyncJobs).where(eq(financeSyncJobs.userId, account.id)).groupBy(financeSyncJobs.status),
      database.select({ value: count() }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.userId, account.id), eq(financeExternalTransactions.direction, "income"), eq(financeExternalTransactions.removed, false))),
      database.select({ value: count() }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.userId, account.id), eq(financeExternalTransactions.direction, "expense"), eq(financeExternalTransactions.removed, false))),
      database.select({ value: count() }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.userId, account.id), eq(financeExternalTransactions.direction, "transfer"), eq(financeExternalTransactions.removed, false))),
      getAccountEntitlements(account.id),
      getActiveFinanceConnectionCount(account.id),
    ]);
    return Response.json({ configured: true, providerConfigured: Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET), providerEnvironment: process.env.PLAID_ENV ?? "sandbox", encryptionConfigured: isCredentialEncryptionConfigured(), webhookConfigured: Boolean(process.env.PLAID_WEBHOOK_URL || process.env.PLAID_ENV !== "production"), connectionCount: connections[0]?.value ?? 0, activeConnectionCount, connectionLimit: entitlements.limits["finance.connectedInstitutions"], canAddConnection: activeConnectionCount < (entitlements.limits["finance.connectedInstitutions"] ?? 1), effectivePlan: entitlements.plan, accountCount: accounts[0]?.value ?? 0, transactionCount: transactions[0]?.value ?? 0, moneyInCount: moneyIn[0]?.value ?? 0, moneyOutCount: moneyOut[0]?.value ?? 0, transferCount: transferCount[0]?.value ?? 0, syncStateCount: sync[0]?.value ?? 0, overrideCount: overrides[0]?.value ?? 0, transferPairCount: transfers[0]?.value ?? 0, savingsGoalCount: goals[0]?.value ?? 0, goalContributionCount: contributions[0]?.value ?? 0, syncJobCount: queuedSyncJobs[0]?.value ?? 0, syncJobs, providers: providerRegistry });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Finance diagnostics unavailable." }, { status: 503 }); }
}
