CREATE TABLE IF NOT EXISTS "donut_batches" (
  "id" text PRIMARY KEY NOT NULL,
  "delivery_date" text NOT NULL,
  "capacity" integer NOT NULL,
  "reserved_count" integer NOT NULL DEFAULT 0,
  "reservation_ttl_minutes" integer NOT NULL DEFAULT 15,
  "status" text NOT NULL DEFAULT 'open',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "donut_batches_capacity_check" CHECK ("capacity" >= 0),
  CONSTRAINT "donut_batches_reserved_count_check" CHECK ("reserved_count" >= 0 AND "reserved_count" <= "capacity"),
  CONSTRAINT "donut_batches_ttl_check" CHECK ("reservation_ttl_minutes" > 0),
  CONSTRAINT "donut_batches_status_check" CHECK ("status" IN ('open', 'closed', 'preparing', 'completed'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "donut_batches_delivery_date_unique" ON "donut_batches" ("delivery_date");
CREATE INDEX IF NOT EXISTS "donut_batches_status_index" ON "donut_batches" ("status");

CREATE TABLE IF NOT EXISTS "donut_orders" (
  "id" text PRIMARY KEY NOT NULL,
  "idempotency_key" text NOT NULL,
  "request_fingerprint" text NOT NULL,
  "public_order_number" text NOT NULL,
  "batch_id" text NOT NULL REFERENCES "donut_batches"("id") ON DELETE RESTRICT,
  "status" text NOT NULL DEFAULT 'pending_payment',
  "production_stage" text,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "phone_e164" text NOT NULL,
  "street_address" text NOT NULL,
  "unit" text,
  "delivery_instructions" text,
  "delivery_window" text NOT NULL,
  "subtotal_cents" integer NOT NULL,
  "delivery_fee_cents" integer NOT NULL,
  "tax_cents" integer NOT NULL,
  "total_cents" integer NOT NULL,
  "reservation_quantity" integer NOT NULL,
  "reservation_expires_at" timestamptz NOT NULL,
  "sms_consent" boolean NOT NULL DEFAULT false,
  "sms_consent_at" timestamptz,
  "payment_provider_intent_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "donut_orders_status_check" CHECK ("status" IN ('pending_payment', 'payment_failed', 'expired', 'cancelled', 'paid', 'accepted', 'completed', 'refunded')),
  CONSTRAINT "donut_orders_production_stage_check" CHECK ("production_stage" IS NULL OR "production_stage" IN ('Accepted', 'Preparing ingredients', 'Kneading', 'First rise', 'Shaping', 'Second rise', 'Frying', 'Cooling', 'Glazing / Filling', 'Setting', 'Out for delivery', 'Delivered')),
  CONSTRAINT "donut_orders_reservation_quantity_check" CHECK ("reservation_quantity" > 0),
  CONSTRAINT "donut_orders_sms_consent_check" CHECK (("sms_consent" = false AND "sms_consent_at" IS NULL) OR ("sms_consent" = true AND "sms_consent_at" IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS "donut_orders_idempotency_key_unique" ON "donut_orders" ("idempotency_key");
CREATE UNIQUE INDEX IF NOT EXISTS "donut_orders_public_number_unique" ON "donut_orders" ("public_order_number");
CREATE INDEX IF NOT EXISTS "donut_orders_batch_status_index" ON "donut_orders" ("batch_id", "status");
CREATE INDEX IF NOT EXISTS "donut_orders_reservation_expiry_index" ON "donut_orders" ("status", "reservation_expires_at");

CREATE TABLE IF NOT EXISTS "donut_order_items" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL REFERENCES "donut_orders"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL,
  "purchased_name" text NOT NULL,
  "purchased_price_cents" integer NOT NULL,
  "quantity" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "donut_order_items_quantity_check" CHECK ("quantity" > 0),
  CONSTRAINT "donut_order_items_price_check" CHECK ("purchased_price_cents" >= 0)
);
CREATE INDEX IF NOT EXISTS "donut_order_items_order_index" ON "donut_order_items" ("order_id");

CREATE TABLE IF NOT EXISTS "donut_order_events" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL REFERENCES "donut_orders"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "from_status" text,
  "to_status" text,
  "from_production_stage" text,
  "to_production_stage" text,
  "actor_account_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "donut_order_events_kind_check" CHECK ("kind" IN ('created', 'reservation_expired', 'payment', 'status', 'production', 'delivery', 'refund', 'cancelled'))
);
CREATE INDEX IF NOT EXISTS "donut_order_events_order_index" ON "donut_order_events" ("order_id", "created_at");

CREATE TABLE IF NOT EXISTS "donut_tracking_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL REFERENCES "donut_orders"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz,
  "last_used_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "donut_tracking_tokens_hash_unique" ON "donut_tracking_tokens" ("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "donut_tracking_tokens_order_unique" ON "donut_tracking_tokens" ("order_id");
CREATE INDEX IF NOT EXISTS "donut_tracking_tokens_expiry_index" ON "donut_tracking_tokens" ("expires_at");
