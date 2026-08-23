import Stripe from "stripe";
import { hasBillingWebhookProcessed, markBillingWebhookProcessed } from "@/services/billing/repository";
import { findBillingUserId, getStripe, isBillingConfigured, syncStripeSubscription } from "@/services/billing/stripe";
import { upsertBillingSubscription } from "@/services/billing/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isBillingConfigured()) return Response.json({ error: "Billing webhook is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return Response.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }
  try {
    if (await hasBillingWebhookProcessed(event.id)) return Response.json({ received: true, duplicate: true });
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.cosmic_user_id ?? session.client_reference_id ?? undefined;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (userId && customerId && !subscriptionId) await upsertBillingSubscription({ userId, providerCustomerId: customerId, providerSubscriptionId: null, providerPriceId: null, status: "inactive", currentPeriodStart: null, currentPeriodEnd: null, cancelAtPeriodEnd: false });
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await syncStripeSubscription(subscription, userId, event.created, event.id);
      }
    } else if (event.type.startsWith("customer.subscription.")) {
      await syncStripeSubscription(event.data.object as Stripe.Subscription, undefined, event.created, event.id);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as unknown as { subscription?: string | null; customer?: string | { id: string } | null };
      if (invoice.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(invoice.subscription);
        await syncStripeSubscription(subscription, await findBillingUserId(typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id, invoice.subscription) ?? undefined, event.created, event.id);
      }
    }
    await markBillingWebhookProcessed(event.id, event.type);
    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", { eventId: event.id, eventType: event.type, error: error instanceof Error ? error.message : "Unknown billing error" });
    return Response.json({ error: "Stripe webhook processing failed." }, { status: 503 });
  }
}
