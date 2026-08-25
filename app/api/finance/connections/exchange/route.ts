import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { assertSameOrigin } from "@/services/security/origin";
import { createFinanceConnection, FinanceConnectionLimitError } from "@/services/finance/connectedStore";
import { getPlaidFinancialProvider } from "@/services/finance/providers/plaid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!isDatabaseConfigured() || !isCredentialEncryptionConfigured()) return Response.json({ error: "Connected Finance requires durable database storage and token encryption." }, { status: 503 });
    const body = await request.json().catch(() => null) as { publicToken?: unknown; existingConnectionId?: unknown } | null;
    if (typeof body?.publicToken !== "string" || body.publicToken.length < 10 || body.publicToken.length > 500) return Response.json({ error: "A valid Link public token is required." }, { status: 400 });
    const provider = getPlaidFinancialProvider();
    const exchanged = await provider.exchangeConnectionToken(body.publicToken);
    const connection = await createFinanceConnection(account.id, { environment: provider.environment, ...exchanged, ...(typeof body?.existingConnectionId === "string" ? { existingConnectionId: body.existingConnectionId } : {}) });
    return Response.json({ connection: { id: connection.id, institutionName: connection.institutionName, status: connection.status, environment: connection.environment } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof FinanceConnectionLimitError) return Response.json({ error: "Free includes one connected financial institution. Upgrade to Cosmic+ to connect additional banks and credit unions.", code: error.code, limit: error.limit }, { status: 403 });
    return Response.json({ error: "The financial institution connection could not be completed." }, { status: 502 });
  }
}
