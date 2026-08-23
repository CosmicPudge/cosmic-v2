import { requireCosmicAccount } from "@/services/auth/server";
import { createCheckoutSession, logStripeBillingError } from "@/services/billing/stripe";
import { BillingActionError } from "@/services/billing/contracts";
import { assertSameOrigin } from "@/services/security/origin";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    const body = await request.json().catch(() => ({})) as { plan?: unknown };
    if (body.plan !== "cosmic_plus") return Response.json({ error: "Only the Cosmic+ plan is available." }, { status: 400 });
    const session = await createCheckoutSession(request, account);
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof BillingActionError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    logStripeBillingError(error, "checkout_session");
    return Response.json({ error: "Checkout is unavailable." }, { status: 503 });
  }
}
