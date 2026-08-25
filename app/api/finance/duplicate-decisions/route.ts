import { and, eq, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireCosmicAccount } from "@/services/auth/server";
import { getDatabase } from "@/services/database/client";
import { financeDuplicateDecisions, financeExternalTransactions } from "@/services/database/schema";
import { assertSameOrigin } from "@/services/security/origin";

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireCosmicAccount(request); const body = await request.json().catch(() => null) as { sourceExternalTransactionId?: unknown; duplicateExternalTransactionId?: unknown; decision?: unknown; confidence?: unknown } | null;
    const source = typeof body?.sourceExternalTransactionId === "string" ? body.sourceExternalTransactionId : ""; const duplicate = typeof body?.duplicateExternalTransactionId === "string" ? body.duplicateExternalTransactionId : ""; const decision = body?.decision === "keep_both" || body?.decision === "treat_duplicate" ? body.decision : null;
    if (!source || !duplicate || source === duplicate || !decision) return Response.json({ error: "A valid duplicate decision is required." }, { status: 400 });
    const database = getDatabase(); const owned = await database.select({ id: financeExternalTransactions.id }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.userId, account.id), or(eq(financeExternalTransactions.id, source), eq(financeExternalTransactions.id, duplicate))));
    if (owned.length !== 2) return Response.json({ error: "Those transactions are not in this Finance scope." }, { status: 404 });
    const [record] = await database.insert(financeDuplicateDecisions).values({ id: randomUUID(), userId: account.id, sourceExternalTransactionId: source, duplicateExternalTransactionId: duplicate, decision, confidence: typeof body?.confidence === "number" && Number.isSafeInteger(body.confidence) ? Math.max(0, Math.min(100, body.confidence)) : 80 }).onConflictDoUpdate({ target: [financeDuplicateDecisions.userId, financeDuplicateDecisions.sourceExternalTransactionId, financeDuplicateDecisions.duplicateExternalTransactionId], set: { decision, updatedAt: new Date() } }).returning();
    return Response.json({ decision: record });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Duplicate decision could not be saved." }, { status: 400 }); }
}
