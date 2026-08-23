import "server-only";

import Stripe from "stripe";
import type { CosmicAccount } from "@/core/contracts/Account";
import { getBillingSubscription, findBillingSubscription, upsertBillingSubscription } from "./repository";
import { BillingActionError, type BillingSubscriptionStatus } from "./contracts";
import { getBillingConfiguration } from "./config";
import { getAuthRepository } from "@/services/auth/repository";

let stripeClient: Stripe | null = null;

export function isBillingConfigured() {
  return getBillingConfiguration().configured;
}

export function isCheckoutConfigured() {
  return getBillingConfiguration().checkoutConfigured;
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe billing is not configured.");
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });
  return stripeClient;
}

export function logStripeBillingError(error: unknown, operation: string) {
  const stripeError = error instanceof Stripe.errors.StripeError ? error : null;
  console.error("Stripe billing operation failed", {
    operation,
    environment: getBillingConfiguration().environment,
    type: stripeError?.type ?? (error instanceof Error ? error.name : "UnknownError"),
    code: stripeError?.code ?? null,
    requestId: stripeError?.requestId ?? null,
  });
}

function isMissingStripeResource(error: unknown) {
  return error instanceof Stripe.errors.StripeError && error.code === "resource_missing";
}

function canReplaceMissingCustomer(record: Awaited<ReturnType<typeof getBillingSubscription>>) {
  if (!record) return true;
  if (record.status === "inactive" || record.status === "incomplete_expired") return true;
  return record.status === "canceled" && (!record.currentPeriodEnd || record.currentPeriodEnd <= new Date());
}

async function getCosmicPlusPrice() {
  const priceId = process.env.STRIPE_COSMIC_PLUS_PRICE_ID;
  if (!priceId) throw new BillingActionError("billing_unavailable", "Cosmic+ billing is not configured.", 503);
  const price = await getStripe().prices.retrieve(priceId);
  if (!price.active || price.currency !== "usd" || price.unit_amount !== 499 || price.type !== "recurring" || price.recurring?.interval !== "month") throw new BillingActionError("billing_unavailable", "Cosmic+ pricing is not configured correctly.", 503);
  return price;
}

function appUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

function dateFromUnix(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function statusFromStripe(value: string): BillingSubscriptionStatus {
  return value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "unpaid" || value === "incomplete" || value === "incomplete_expired" || value === "paused" ? value : "inactive";
}

export async function ensureStripeCustomer(account: CosmicAccount) {
  const existing = await getBillingSubscription(account.id);
  let replacingMissingCustomer = false;
  if (existing?.providerCustomerId) {
    try {
      const customer = await getStripe().customers.retrieve(existing.providerCustomerId);
      if (customer.deleted) throw new Error("Stripe customer is deleted.");
      return customer.id;
    } catch (error) {
      if (!isMissingStripeResource(error)) {
        logStripeBillingError(error, "retrieve_customer");
        throw new BillingActionError("billing_unavailable", "Cosmic+ billing could not verify the customer. Please try again.", 503);
      }
      logStripeBillingError(error, "retrieve_customer_missing");
      if (!canReplaceMissingCustomer(existing)) {
        console.error("Stripe customer mapping is missing for a subscription that requires recovery", { accountId: account.id, status: existing.status, hasSubscription: Boolean(existing.providerSubscriptionId), environment: getBillingConfiguration().environment });
        throw new BillingActionError("billing_unavailable", "This subscription needs billing recovery before a new checkout can start.", 503);
      }
      replacingMissingCustomer = true;
    }
  }
  const customer = await getStripe().customers.create({ email: account.email, name: account.displayName ?? undefined, metadata: { cosmic_user_id: account.id } }, { idempotencyKey: `cosmic-customer-${account.id}` });
  await upsertBillingSubscription({ userId: account.id, providerCustomerId: customer.id, providerSubscriptionId: replacingMissingCustomer ? null : existing?.providerSubscriptionId ?? null, providerPriceId: replacingMissingCustomer ? null : existing?.providerPriceId ?? null, status: replacingMissingCustomer ? "inactive" : existing?.status ?? "inactive", currentPeriodStart: replacingMissingCustomer ? null : existing?.currentPeriodStart ?? null, currentPeriodEnd: replacingMissingCustomer ? null : existing?.currentPeriodEnd ?? null, cancelAtPeriodEnd: replacingMissingCustomer ? false : existing?.cancelAtPeriodEnd ?? false });
  return customer.id;
}

export async function createCheckoutSession(request: Request, account: CosmicAccount) {
  if (!isCheckoutConfigured()) throw new BillingActionError("billing_unavailable", "Cosmic+ billing is not configured.", 503);
  const price = await getCosmicPlusPrice();
  const existing = await getBillingSubscription(account.id);
  if (existing?.providerSubscriptionId && ["active", "trialing", "past_due", "incomplete", "paused"].includes(existing.status)) throw new BillingActionError("already_subscribed", "A Cosmic+ subscription already exists for this account. Manage billing instead.");
  if (existing?.providerSubscriptionId && existing.status === "canceled" && existing.currentPeriodEnd && existing.currentPeriodEnd > new Date()) throw new BillingActionError("subscription_cancel_pending", "Cosmic+ is still active until the current period ends. Resume it instead of creating a new subscription.");
  const customer = await ensureStripeCustomer(account);
  return getStripe().checkout.sessions.create({ mode: "subscription", customer, line_items: [{ price: price.id, quantity: 1 }], client_reference_id: account.id, metadata: { cosmic_user_id: account.id, cosmic_plan: "cosmic_plus", cosmic_price_id: price.id }, subscription_data: { metadata: { cosmic_user_id: account.id, cosmic_plan: "cosmic_plus" } }, success_url: `${appUrl(request)}/cosmic-plus?checkout=success`, cancel_url: `${appUrl(request)}/cosmic-plus?checkout=canceled` });
}

export async function createBillingPortalSession(request: Request, account: CosmicAccount) {
  if (!isBillingConfigured()) throw new Error("Cosmic+ billing is not configured.");
  const record = await getBillingSubscription(account.id);
  if (!record?.providerCustomerId) throw new Error("No Stripe customer exists for this account.");
  return getStripe().billingPortal.sessions.create({ customer: record.providerCustomerId, return_url: `${appUrl(request)}/cosmic-plus` });
}

export async function updateSubscriptionCancellation(account: CosmicAccount, cancelAtPeriodEnd: boolean) {
  if (!isBillingConfigured()) throw new Error("Cosmic+ billing is not configured.");
  const record = await getBillingSubscription(account.id);
  if (!record?.providerSubscriptionId) throw new Error("No active Cosmic+ subscription exists.");
  const subscription = await getStripe().subscriptions.update(record.providerSubscriptionId, { cancel_at_period_end: cancelAtPeriodEnd });
  return syncStripeSubscription(subscription, account.id);
}

export async function cancelSubscriptionForAccountDeletion(account: CosmicAccount) {
  const record = await getBillingSubscription(account.id);
  if (!record?.providerSubscriptionId || record.status === "inactive" || (record.status === "canceled" && (!record.currentPeriodEnd || record.currentPeriodEnd <= new Date()))) return;
  if (!isBillingConfigured()) throw new Error("The active Stripe subscription must be canceled before this account can be deleted.");
  await getStripe().subscriptions.cancel(record.providerSubscriptionId);
}

export async function syncStripeSubscription(subscription: Stripe.Subscription, userId?: string, eventCreated?: number, eventId?: string) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const existing = await findBillingSubscription({ providerCustomerId: customerId, providerSubscriptionId: subscription.id });
  if (existing && eventCreated !== undefined && (existing.lastEventCreated !== null && eventCreated < existing.lastEventCreated || existing.lastEventId === eventId)) return existing;
  const resolvedUserId = userId ?? existing?.userId ?? subscription.metadata.cosmic_user_id;
  if (!resolvedUserId) throw new Error("Stripe subscription is not mapped to a Cosmic account.");
  if (!existing && !(await getAuthRepository().findUserById(resolvedUserId))) return null;
  if (existing && eventCreated !== undefined && existing.lastEventCreated !== null && eventCreated < existing.lastEventCreated) return existing;
  const period = subscription.items.data[0];
  return upsertBillingSubscription({ userId: resolvedUserId, providerCustomerId: customerId, providerSubscriptionId: subscription.id, providerPriceId: period?.price.id ?? null, status: statusFromStripe(subscription.status), currentPeriodStart: dateFromUnix(period?.current_period_start), currentPeriodEnd: dateFromUnix(period?.current_period_end), cancelAtPeriodEnd: subscription.cancel_at_period_end, lastEventCreated: eventCreated ?? null, lastEventId: eventId ?? null });
}

export async function findBillingUserId(customerId?: string | null, subscriptionId?: string | null) {
  const record = await findBillingSubscription({ providerCustomerId: customerId, providerSubscriptionId: subscriptionId });
  return record?.userId ?? null;
}
