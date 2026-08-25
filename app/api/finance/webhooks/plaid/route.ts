import { enqueueFinanceSyncJob, getFinanceConnectionByProviderId, setFinanceConnectionStatus } from "@/services/finance/connectedStore";
import { verifyPlaidWebhook } from "@/services/finance/providers/plaid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!(await verifyPlaidWebhook(rawBody, request.headers.get("plaid-verification")))) return Response.json({ error: "Webhook verification failed." }, { status: 401 });
  try {
    const body = JSON.parse(rawBody) as { webhook_type?: unknown; webhook_code?: unknown; item_id?: unknown };
    if (body.webhook_type !== "TRANSACTIONS" || typeof body.item_id !== "string") return Response.json({ received: true });
    const connection = await getFinanceConnectionByProviderId("plaid", body.item_id);
    if (!connection) return Response.json({ received: true });
    if (body.webhook_code === "ITEM_LOGIN_REQUIRED") await setFinanceConnectionStatus(connection.userId, connection.id, { status: "reconnect_required", reconnectRequired: true, errorCategory: "reconnect_required" });
    else await enqueueFinanceSyncJob(connection.userId, connection.id, typeof body.webhook_code === "string" ? body.webhook_code : "provider_update");
    return Response.json({ received: true });
  } catch { return Response.json({ received: true }); }
}
