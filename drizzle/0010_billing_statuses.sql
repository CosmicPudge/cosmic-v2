ALTER TABLE "billing_subscriptions" DROP CONSTRAINT "billing_subscriptions_status_check";--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_status_check" CHECK ("billing_subscriptions"."status" in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused'));
