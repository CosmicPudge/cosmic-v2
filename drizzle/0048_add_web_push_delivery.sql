CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "user_agent" text,
  "device_label" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_success_at" timestamptz,
  "last_failure_at" timestamptz,
  "failure_code" text
);
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_unique" ON "push_subscriptions" ("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_index" ON "push_subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "push_subscriptions_status_index" ON "push_subscriptions" ("status");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_status_check" CHECK ("status" in ('active', 'inactive', 'expired'));

CREATE TABLE IF NOT EXISTS "push_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "signal_id" text NOT NULL,
  "subscription_id" text NOT NULL REFERENCES "push_subscriptions"("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "event_id" text,
  "sport" text,
  "status" text NOT NULL DEFAULT 'pending',
  "attempt_count" integer NOT NULL DEFAULT 0,
  "provider_code" integer,
  "title" text,
  "body" text,
  "route" text,
  "first_attempt_at" timestamptz,
  "last_attempt_at" timestamptz,
  "delivered_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "push_deliveries_signal_subscription_unique" ON "push_deliveries" ("signal_id", "subscription_id");
CREATE INDEX IF NOT EXISTS "push_deliveries_signal_id_index" ON "push_deliveries" ("signal_id");
CREATE INDEX IF NOT EXISTS "push_deliveries_status_index" ON "push_deliveries" ("status");
ALTER TABLE "push_deliveries" ADD CONSTRAINT "push_deliveries_status_check" CHECK ("status" in ('pending', 'sending', 'delivered', 'temporary_failure', 'permanent_failure'));

CREATE TABLE IF NOT EXISTS "sports_event_checkpoints" (
  "id" text PRIMARY KEY NOT NULL,
  "sport" text NOT NULL,
  "event_id" text NOT NULL,
  "provider" text NOT NULL,
  "event_status" text NOT NULL,
  "normalized_state" jsonb NOT NULL,
  "observed_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "sports_event_checkpoints_identity_unique" ON "sports_event_checkpoints" ("provider", "sport", "event_id");
CREATE INDEX IF NOT EXISTS "sports_event_checkpoints_status_index" ON "sports_event_checkpoints" ("event_status");
CREATE INDEX IF NOT EXISTS "sports_event_checkpoints_observed_at_index" ON "sports_event_checkpoints" ("observed_at");
