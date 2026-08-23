export type BillingProvider = "stripe";
export type BillingSubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";

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

export function isSubscriptionEntitled(subscription: Pick<BillingSubscriptionRecord, "status" | "currentPeriodEnd"> | null, now = new Date()) {
  if (!subscription || subscription.status === "unpaid" || subscription.status === "inactive") return false;
  if (subscription.status === "active" || subscription.status === "trialing") return true;
  return Boolean(subscription.currentPeriodEnd && subscription.currentPeriodEnd.getTime() > now.getTime());
}
