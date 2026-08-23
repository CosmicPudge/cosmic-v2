import { requireCosmicAccount } from "@/services/auth/server";
import { createBillingPortalSession } from "@/services/billing/stripe";

export async function POST(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    const session = await createBillingPortalSession(request, account);
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Billing portal is unavailable." }, { status: 503 });
  }
}
