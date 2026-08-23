import { requireCosmicAccount } from "@/services/auth/server";
import { createBillingPortalSession } from "@/services/billing/stripe";
import { assertSameOrigin } from "@/services/security/origin";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    const session = await createBillingPortalSession(request, account);
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Billing portal is unavailable." }, { status: 503 });
  }
}
