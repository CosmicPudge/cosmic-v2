import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { enqueueFinanceSyncJob, getFinanceConnection } from "@/services/finance/connectedStore";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ connectionId: string }> }) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!isDatabaseConfigured()) return Response.json({ error: "Connected Finance requires durable database storage." }, { status: 503 });
    const { connectionId } = await context.params;
    const connection = await getFinanceConnection(account.id, connectionId);
    if (!connection) return Response.json({ error: "Finance connection not found." }, { status: 404 });
    if (connection.errorCategory === "plus_required") return Response.json({ error: "This institution is paused — Cosmic+ is required to resume syncing." }, { status: 403 });
    const jobId = await enqueueFinanceSyncJob(account.id, connectionId, "manual_refresh");
    return Response.json({ status: "queued", jobId }, { status: 202 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "The refresh could not be queued. Your last saved Finance state is still available." }, { status: 503 });
  }
}
