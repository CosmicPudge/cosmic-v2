import { requireCosmicAccount } from "@/services/auth/server";
import { isDatabaseConfigured } from "@/services/database/client";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { assertSameOrigin } from "@/services/security/origin";
import { getPlaidFinancialProvider } from "@/services/finance/providers/plaid";
import { assertFinanceConnectionAllowed, FinanceConnectionLimitError } from "@/services/finance/connectedStore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!isDatabaseConfigured() || !isCredentialEncryptionConfigured()) return Response.json({ error: "Connected Finance requires durable database storage and token encryption." }, { status: 503 });
    const body = await request.json().catch(() => null) as { existingConnectionId?: unknown } | null;
    const existingConnectionId = typeof body?.existingConnectionId === "string" ? body.existingConnectionId : undefined;
    await assertFinanceConnectionAllowed(account.id, existingConnectionId);
    const provider = getPlaidFinancialProvider();
    const webhookUrl = process.env.PLAID_WEBHOOK_URL ?? (provider.environment === "production" ? "https://cosmicpudge.shop/api/finance/webhooks/plaid" : new URL("/api/finance/webhooks/plaid", request.url).toString());
    if (provider.environment === "production" && new URL(webhookUrl).origin !== "https://cosmicpudge.shop") return Response.json({ error: "Production Plaid webhooks must use https://cosmicpudge.shop." }, { status: 500 });
    return Response.json(await provider.createConnectionSession({ userId: account.id, webhookUrl }));
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof FinanceConnectionLimitError) return Response.json({ error: "Free includes one connected financial institution. Upgrade to Cosmic+ to connect additional banks and credit unions.", code: error.code, limit: error.limit }, { status: 403 });
    return Response.json({ error: "Connected Finance is not configured yet." }, { status: 503 });
  }
}
