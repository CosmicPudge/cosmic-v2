import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireCosmicAccount } from "@/services/auth/server";
import { getDatabase } from "@/services/database/client";
import { financeExternalAccounts, financeGoalContributions, financeSavingsGoals } from "@/services/database/schema";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const account = await requireCosmicAccount(request); const database = getDatabase();
    const [goals, contributions] = await Promise.all([database.select().from(financeSavingsGoals).where(and(eq(financeSavingsGoals.userId, account.id), eq(financeSavingsGoals.archived, false))), database.select({ goalId: financeGoalContributions.goalId, amountMinor: financeGoalContributions.amountMinor, externalTransactionId: financeGoalContributions.externalTransactionId }).from(financeGoalContributions).where(eq(financeGoalContributions.userId, account.id))]);
    const balances = await database.select({ id: financeExternalAccounts.id, currentBalanceMinor: financeExternalAccounts.currentBalanceMinor }).from(financeExternalAccounts).where(eq(financeExternalAccounts.userId, account.id));
    const balanceMap = new Map(balances.map((item) => [item.id, item.currentBalanceMinor ?? 0])); const contributionMap = new Map<string, number>(); const contributionIds = new Map<string, string[]>(); contributions.forEach((item) => { contributionMap.set(item.goalId, (contributionMap.get(item.goalId) ?? 0) + item.amountMinor); if (item.externalTransactionId) contributionIds.set(item.goalId, [...(contributionIds.get(item.goalId) ?? []), item.externalTransactionId]); });
    return Response.json({ goals: goals.map((goal) => ({ ...goal, contributionExternalIds: contributionIds.get(goal.id) ?? [], progressMinor: goal.progressMode === "dedicated_account" ? balanceMap.get(goal.linkedAccountId ?? "") ?? 0 : goal.progressMode === "contributions" ? contributionMap.get(goal.id) ?? 0 : goal.manualAssignedMinor })) });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Savings goals are unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireCosmicAccount(request); const body = await request.json().catch(() => null) as { name?: unknown; targetAmountMinor?: unknown; targetDate?: unknown; progressMode?: unknown; linkedAccountId?: unknown; manualAssignedMinor?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : ""; const target = typeof body?.targetAmountMinor === "number" ? body.targetAmountMinor : 0; const mode = body?.progressMode;
    if (!name || name.length > 100 || !Number.isSafeInteger(target) || target <= 0 || !["manual", "dedicated_account", "contributions"].includes(String(mode))) return Response.json({ error: "Enter a name, target, and valid progress mode." }, { status: 400 });
    const database = getDatabase();
    if (mode === "dedicated_account") {
      if (typeof body?.linkedAccountId !== "string" || !body.linkedAccountId) return Response.json({ error: "Choose a connected account for a dedicated-account goal." }, { status: 400 });
      const ownedAccount = await database.select({ id: financeExternalAccounts.id }).from(financeExternalAccounts).where(and(eq(financeExternalAccounts.userId, account.id), eq(financeExternalAccounts.id, body.linkedAccountId))).limit(1);
      if (!ownedAccount[0]) return Response.json({ error: "That connected account is not available in this Finance scope." }, { status: 404 });
      const existing = await database.select({ id: financeSavingsGoals.id }).from(financeSavingsGoals).where(and(eq(financeSavingsGoals.userId, account.id), eq(financeSavingsGoals.linkedAccountId, body.linkedAccountId), eq(financeSavingsGoals.progressMode, "dedicated_account"), eq(financeSavingsGoals.archived, false))).limit(1); if (existing[0]) return Response.json({ error: "That account is already dedicated to another goal. Use contribution mapping for multiple goals." }, { status: 409 });
    }
    const now = new Date(); const [goal] = await database.insert(financeSavingsGoals).values({ id: randomUUID(), userId: account.id, name, targetAmountMinor: target, targetDate: typeof body?.targetDate === "string" ? body.targetDate : null, progressMode: String(mode) as "manual" | "dedicated_account" | "contributions", linkedAccountId: typeof body?.linkedAccountId === "string" ? body.linkedAccountId : null, manualAssignedMinor: typeof body?.manualAssignedMinor === "number" && Number.isSafeInteger(body.manualAssignedMinor) ? body.manualAssignedMinor : 0, createdAt: now, updatedAt: now }).returning();
    return Response.json({ goal }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Savings goal could not be created." }, { status: 400 }); }
}
