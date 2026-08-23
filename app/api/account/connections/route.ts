import { requireCosmicAccount } from "@/services/auth/server";
import { deleteProviderConnection, listProviderConnections } from "@/services/providers/store";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { clearWritableEventTargets } from "@/services/calendar/writableEventRegistry";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    if (!isCredentialEncryptionConfigured()) return Response.json({ error: "Provider connections are not configured." }, { status: 503 });
    const connections = await listProviderConnections(account.id);
    return Response.json({ connections: connections.map(({ id, provider, providerType, displayName, email, status, reconnectRequired, lastSuccessfulRefreshAt, createdAt, updatedAt }) => ({ id, provider, providerType, displayName, email, status, reconnectRequired, lastSuccessfulRefreshAt, createdAt, updatedAt })) });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Provider connections are temporarily unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    const body = await request.json().catch(() => null) as { connectionId?: unknown } | null;
    if (typeof body?.connectionId !== "string") return Response.json({ error: "connectionId is required." }, { status: 400 });
    if (!(await deleteProviderConnection(account.id, body.connectionId))) return Response.json({ error: "Connection not found." }, { status: 404 });
    clearWritableEventTargets(`${account.id}:${body.connectionId}`);
    return Response.json({ disconnected: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Provider connection could not be removed." }, { status: 503 });
  }
}
