export type BillingProvider = "stripe";
export type BillingSubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused";

export class BillingActionError extends Error {
  constructor(public readonly code: "already_subscribed" | "subscription_cancel_pending" | "billing_unavailable", message: string, public readonly status = 409) {
    super(message);
    this.name = "BillingActionError";
  }
}

export interface BillingSubscriptionRecord {
  id: string;
  userId: string;
  provider: BillingProvider;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPriceId: string | null;
  status: BillingSubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  lastEventCreated: number | null;
  lastEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function isSubscriptionEntitled(subscription: Pick<BillingSubscriptionRecord, "status" | "currentPeriodEnd" | "providerPriceId"> | null, now = new Date(), expectedPriceId?: string) {
  if (!subscription || subscription.status === "unpaid" || subscription.status === "inactive" || subscription.status === "incomplete" || subscription.status === "incomplete_expired" || subscription.status === "paused") return false;
  if (expectedPriceId && subscription.providerPriceId !== expectedPriceId) return false;
  if (subscription.status === "active" || subscription.status === "trialing") return true;
  return Boolean(subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() > now.getTime());
}
