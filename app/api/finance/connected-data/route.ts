import { and, desc, eq, ilike, lt, or } from "drizzle-orm";
import { requireCosmicAccount } from "@/services/auth/server";
import { getDatabase } from "@/services/database/client";
import { financeConnections, financeDuplicateDecisions, financeExternalAccounts, financeExternalTransactions, financeTransactionOverrides } from "@/services/database/schema";
import { reconcileFinanceConnectionEntitlements } from "@/services/finance/connectedStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    await reconcileFinanceConnectionEntitlements(account.id);
    const database = getDatabase();
    const params = new URL(request.url).searchParams;
    const limit = Math.min(200, Math.max(25, Number(params.get("limit") ?? 100) || 100));
    const query = params.get("q")?.trim();
    const cursor = params.get("cursor");
    const cursorParts = cursor ? Buffer.from(cursor, "base64url").toString("utf8").split("|") : [];
    const cursorDate = cursorParts[0] || undefined;
    const cursorId = cursorParts[1] || undefined;
    const transactionWhere = and(eq(financeExternalTransactions.userId, account.id), eq(financeExternalTransactions.removed, false), ...(query ? [or(ilike(financeExternalTransactions.description, `%${query}%`), ilike(financeExternalTransactions.merchant, `%${query}%`), ilike(financeExternalTransactions.providerCategory, `%${query}%`))] : []), ...(cursorDate && cursorId ? [or(lt(financeExternalTransactions.postedDate, cursorDate), and(eq(financeExternalTransactions.postedDate, cursorDate), lt(financeExternalTransactions.id, cursorId)))] : []));
    const [accounts, transactions] = await Promise.all([
      database.select({ id: financeExternalAccounts.id, connectionId: financeExternalAccounts.connectionId, name: financeExternalAccounts.name, type: financeExternalAccounts.type, subtype: financeExternalAccounts.subtype, mask: financeExternalAccounts.mask, currency: financeExternalAccounts.currency, currentBalanceMinor: financeExternalAccounts.currentBalanceMinor, availableBalanceMinor: financeExternalAccounts.availableBalanceMinor, creditLimitMinor: financeExternalAccounts.creditLimitMinor, status: financeExternalAccounts.status, connectionStatus: financeConnections.status, lastUpdatedAt: financeExternalAccounts.lastUpdatedAt, provider: financeConnections.provider, institutionName: financeConnections.institutionName }).from(financeExternalAccounts).innerJoin(financeConnections, eq(financeExternalAccounts.connectionId, financeConnections.id)).where(eq(financeExternalAccounts.userId, account.id)),
      database.select({ id: financeExternalTransactions.id, externalAccountId: financeExternalTransactions.externalAccountId, date: financeExternalTransactions.postedDate, description: financeExternalTransactions.description, merchant: financeExternalTransactions.merchant, amountMinor: financeExternalTransactions.amountMinor, direction: financeExternalTransactions.direction, status: financeExternalTransactions.status, providerCategory: financeExternalTransactions.providerCategory, removed: financeExternalTransactions.removed, pendingProviderTransactionId: financeExternalTransactions.pendingProviderTransactionId }).from(financeExternalTransactions).where(transactionWhere).orderBy(desc(financeExternalTransactions.postedDate), desc(financeExternalTransactions.id)).limit(limit + 1),
    ]);
    const hasMore = transactions.length > limit;
    const page = hasMore ? transactions.slice(0, limit) : transactions;
    const overrides = page.length ? await database.select({ externalTransactionId: financeTransactionOverrides.externalTransactionId, categoryId: financeTransactionOverrides.categoryId, ignored: financeTransactionOverrides.ignored, isSubscription: financeTransactionOverrides.isSubscription, notes: financeTransactionOverrides.notes }).from(financeTransactionOverrides).where(and(eq(financeTransactionOverrides.userId, account.id), or(...page.map((item) => eq(financeTransactionOverrides.externalTransactionId, item.id))))) : [];
    const duplicateDecisions = page.length ? await database.select({ sourceExternalTransactionId: financeDuplicateDecisions.sourceExternalTransactionId, duplicateExternalTransactionId: financeDuplicateDecisions.duplicateExternalTransactionId, decision: financeDuplicateDecisions.decision }).from(financeDuplicateDecisions).where(and(eq(financeDuplicateDecisions.userId, account.id), or(...page.map((item) => eq(financeDuplicateDecisions.sourceExternalTransactionId, item.id)), ...page.map((item) => eq(financeDuplicateDecisions.duplicateExternalTransactionId, item.id))))) : [];
    const duplicateMap = new Map(duplicateDecisions.map((item) => [item.duplicateExternalTransactionId, item.decision]));
    const overrideMap = new Map(overrides.map((item) => [item.externalTransactionId, item]));
    const normalized = page.map((item) => ({ ...item, source: "connected" as const, ...(overrideMap.get(item.id) ?? {}), ...(duplicateMap.get(item.id) === "treat_duplicate" ? { ignored: true } : {}) }));
    const last = page.at(-1);
    const nextCursor = hasMore && last?.date ? Buffer.from(`${last.date}|${last.id}`).toString("base64url") : null;
    const duplicateGroups = new Map<string, typeof accounts>(); accounts.forEach((item) => { const key = `${item.name.toLocaleLowerCase()}|${item.mask ?? ""}|${item.type}|${item.subtype ?? ""}|${item.currency}`; duplicateGroups.set(key, [...(duplicateGroups.get(key) ?? []), item]); });
    const duplicateCandidates = [...duplicateGroups.values()].filter((group) => new Set(group.map((item) => item.connectionId)).size > 1).flatMap((group) => group.map((item) => ({ accountId: item.id, connectionId: item.connectionId, provider: item.provider, institutionName: item.institutionName, mask: item.mask, type: item.type })));
    return Response.json({ accounts, transactions: normalized, nextCursor, hasMore, duplicateCandidates });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Connected Finance data is unavailable." }, { status: 503 }); }
}
