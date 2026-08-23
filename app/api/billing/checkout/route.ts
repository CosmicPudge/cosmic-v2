import { requireCosmicAccount } from "@/services/auth/server";
import { createCheckoutSession } from "@/services/billing/stripe";
import { BillingActionError } from "@/services/billing/contracts";

export async function POST(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    const body = await request.json().catch(() => ({})) as { plan?: unknown };
    if (body.plan !== "cosmic_plus") return Response.json({ error: "Only the Cosmic+ plan is available." }, { status: 400 });
    const session = await createCheckoutSession(request, account);
    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof BillingActionError) return Response.json({ error: error.message, code: error.code }, { status: error.status });
    return Response.json({ error: error instanceof Error ? error.message : "Checkout is unavailable." }, { status: 503 });
  }
}
