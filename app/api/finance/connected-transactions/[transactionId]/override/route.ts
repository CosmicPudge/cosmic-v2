import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { requireCosmicAccount } from "@/services/auth/server";
import { getDatabase } from "@/services/database/client";
import { financeExternalTransactions, financeTransactionOverrides } from "@/services/database/schema";
import { assertSameOrigin } from "@/services/security/origin";

export async function PUT(request: Request, context: { params: Promise<{ transactionId: string }> }) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    const { transactionId } = await context.params;
    const body = await request.json().catch(() => null) as { categoryId?: unknown; ignored?: unknown; isSubscription?: unknown; notes?: unknown } | null;
    const owned = await getDatabase().select({ id: financeExternalTransactions.id }).from(financeExternalTransactions).where(and(eq(financeExternalTransactions.id, transactionId), eq(financeExternalTransactions.userId, account.id))).limit(1);
    if (!owned[0]) return Response.json({ error: "Connected transaction not found." }, { status: 404 });
    const values = { userId: account.id, externalTransactionId: transactionId, categoryId: typeof body?.categoryId === "string" && body.categoryId.length <= 200 ? body.categoryId : null, ignored: body?.ignored === true, isSubscription: typeof body?.isSubscription === "boolean" ? body.isSubscription : null, notes: typeof body?.notes === "string" && body.notes.length <= 1000 ? body.notes : null, updatedAt: new Date() };
    await getDatabase().insert(financeTransactionOverrides).values({ id: randomUUID(), ...values }).onConflictDoUpdate({ target: [financeTransactionOverrides.userId, financeTransactionOverrides.externalTransactionId], set: values });
    return Response.json({ saved: true });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Connected transaction override could not be saved." }, { status: 400 }); }
}
