import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireCosmicAccount } from "@/services/auth/server";
import { getDatabase } from "@/services/database/client";
import { financeExternalTransactions, financeGoalContributions, financeSavingsGoals } from "@/services/database/schema";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ goalId: string }> }) {
  try {
    assertSameOrigin(request); const account = await requireCosmicAccount(request); const { goalId } = await context.params; const body = await request.json().catch(() => null) as { externalTransactionId?: unknown } | null; const transactionId = typeof body?.externalTransactionId === "string" ? body.externalTransactionId : ""; if (!transactionId) return Response.json({ error: "A connected transaction is required." }, { status: 400 }); const database = getDatabase(); const [goal, transaction] = await Promise.all([database.select({ id: financeSavingsGoals.id }).from(financeSavingsGoals).where(and(eq(financeSavingsGoals.id, goalId), eq(financeSavingsGoals.userId, account.id))).limit(1), database.select({ id: financeExternalTransactions.id, amountMinor: financeExternalTransactions.amountMinor, direction: financeExternalTransactions.direction }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.id, transactionId), eq(financeExternalTransactions.userId, account.id), eq(financeExternalTransactions.removed, false))).limit(1)]); if (!goal[0] || !transaction[0]) return Response.json({ error: "Goal or transaction not found in this Finance scope." }, { status: 404 }); if (transaction[0].direction !== "income" && transaction[0].direction !== "transfer") return Response.json({ error: "Only deposits or transfers can count toward a savings goal." }, { status: 400 }); const [contribution] = await database.insert(financeGoalContributions).values({ id: randomUUID(), userId: account.id, goalId, externalTransactionId: transactionId, amountMinor: transaction[0].amountMinor }).onConflictDoNothing().returning(); return Response.json({ contribution: contribution ?? null });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Contribution could not be mapped." }, { status: 400 }); }
}

export async function DELETE(request: Request, context: { params: Promise<{ goalId: string }> }) {
  try { assertSameOrigin(request); const account = await requireCosmicAccount(request); const { goalId } = await context.params; const transactionId = new URL(request.url).searchParams.get("externalTransactionId"); if (!transactionId) return Response.json({ error: "A connected transaction is required." }, { status: 400 }); await getDatabase().delete(financeGoalContributions).where(and(eq(financeGoalContributions.userId, account.id), eq(financeGoalContributions.goalId, goalId), eq(financeGoalContributions.externalTransactionId, transactionId))); return Response.json({ removed: true }); } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Contribution could not be removed." }, { status: 400 }); }
}
