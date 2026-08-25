import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { getActiveFinanceConnectionCount, getFinanceConnectionLimit, listFinanceConnections, reconcileFinanceConnectionEntitlements } from "@/services/finance/connectedStore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    if (!isDatabaseConfigured()) return Response.json({ connections: [], configured: false });
    await reconcileFinanceConnectionEntitlements(account.id);
    const connections = await listFinanceConnections(account.id);
    const [count, limit] = await Promise.all([getActiveFinanceConnectionCount(account.id), getFinanceConnectionLimit(account.id)]);
    return Response.json({ configured: true, connectionCount: count, connectionLimit: limit, canAddConnection: count < limit, connections: connections.map((item) => ({ id: item.id, institutionName: item.institutionName, provider: item.provider, environment: item.environment, status: item.status, reconnectRequired: item.reconnectRequired, lastSuccessfulSyncAt: item.lastSuccessfulSyncAt, lastAttemptedSyncAt: item.lastAttemptedSyncAt, errorCategory: item.errorCategory })) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Finance connections are temporarily unavailable." }, { status: 503 });
  }
}
