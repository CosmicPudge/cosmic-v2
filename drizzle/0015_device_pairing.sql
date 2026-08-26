ALTER TABLE "sessions" ADD COLUMN "session_type" text DEFAULT 'user' NOT NULL;
ALTER TABLE "sessions" ADD COLUMN "device_id" text;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_type_check" CHECK ("sessions"."session_type" in ('user', 'device'));
CREATE INDEX "sessions_device_id_index" ON "sessions" USING btree ("device_id");
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Cosmic Display' NOT NULL,
	"type" text DEFAULT 'display' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
CREATE INDEX "devices_user_id_index" ON "devices" USING btree ("user_id");
CREATE INDEX "devices_active_index" ON "devices" USING btree ("revoked_at");
CREATE TABLE "device_pairings" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code_hash" text NOT NULL,
	"user_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"user_id" text,
	"device_name" text,
	"device_type" text DEFAULT 'display' NOT NULL,
	"last_polled_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "device_pairings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null,
	CONSTRAINT "device_pairings_status_check" CHECK ("device_pairings"."status" in ('pending', 'approved', 'expired', 'denied', 'consumed'))
);
CREATE UNIQUE INDEX "device_pairings_device_hash_unique" ON "device_pairings" USING btree ("device_code_hash");
CREATE UNIQUE INDEX "device_pairings_user_code_unique" ON "device_pairings" USING btree ("user_code");
CREATE INDEX "device_pairings_status_expires_index" ON "device_pairings" USING btree ("status", "expires_at");
CREATE INDEX "device_pairings_user_id_index" ON "device_pairings" USING btree ("user_id");
