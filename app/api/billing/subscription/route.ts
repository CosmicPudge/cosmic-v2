import { requireCosmicAccount } from "@/services/auth/server";
import { updateSubscriptionCancellation } from "@/services/billing/stripe";
import { assertSameOrigin } from "@/services/security/origin";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    const body = await request.json().catch(() => ({})) as { action?: unknown };
    if (body.action !== "cancel" && body.action !== "resume") return Response.json({ error: "Choose cancel or resume." }, { status: 400 });
    const subscription = await updateSubscriptionCancellation(account, body.action === "cancel");
    if (!subscription) return Response.json({ error: "Subscription is no longer attached to this account." }, { status: 409 });
    return Response.json({ subscription: { status: subscription.status, currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Subscription update is unavailable." }, { status: 503 });
  }
}
