CREATE TABLE "billing_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"provider_price_id" text,
	"status" text DEFAULT 'inactive' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_provider_check" CHECK ("billing_subscriptions"."provider" = 'stripe'),
	CONSTRAINT "billing_subscriptions_status_check" CHECK ("billing_subscriptions"."status" in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'))
);
--> statement-breakpoint
CREATE TABLE "billing_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_user_provider_unique" ON "billing_subscriptions" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_customer_unique" ON "billing_subscriptions" USING btree ("provider_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_subscription_unique" ON "billing_subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_status_index" ON "billing_subscriptions" USING btree ("status");