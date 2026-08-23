import { getCurrentCosmicAccount } from "@/services/auth/server";
import { resolveEntitlements } from "@/services/entitlements/service";
import { getBillingSubscription } from "@/services/billing/repository";
import { isCheckoutConfigured } from "@/services/billing/stripe";
import { getBillingConfiguration } from "@/services/billing/config";
import { getLastBillingWebhook } from "@/services/billing/repository";
import { isSubscriptionEntitled } from "@/services/billing/contracts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await getCurrentCosmicAccount(request);
  const subscription = account ? await getBillingSubscription(account.id).catch(() => null) : null;
  const entitlements = await resolveEntitlements(request);
  const configuration = getBillingConfiguration();
  const lastWebhook = await getLastBillingWebhook().catch(() => null);
  return Response.json({ configured: isCheckoutConfigured(), configuration: { configured: configuration.configured, checkoutConfigured: configuration.checkoutConfigured, webhookConfigured: configuration.webhookConfigured, testMode: configuration.testMode, environment: configuration.environment, modeMismatch: configuration.modeMismatch, liveModeBlocked: configuration.liveModeBlocked, priceConfigured: Boolean(process.env.STRIPE_COSMIC_PLUS_PRICE_ID), missing: configuration.missing }, customerExists: Boolean(subscription?.providerCustomerId), billingPlan: isSubscriptionEntitled(subscription, new Date(), process.env.STRIPE_COSMIC_PLUS_PRICE_ID) ? "cosmic_plus" : "free", plan: entitlements.plan, subscription: subscription ? { status: subscription.status, currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null, currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd } : null, lastWebhookEvent: lastWebhook ? { id: lastWebhook.eventId, type: lastWebhook.eventType, processedAt: lastWebhook.processedAt.toISOString() } : null }, { headers: { "Cache-Control": "no-store" } });
}
