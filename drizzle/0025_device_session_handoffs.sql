CREATE TABLE IF NOT EXISTS "device_session_handoffs" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"device_id" text NOT NULL,
	"user_id" text NOT NULL,
	"boot_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "device_session_handoffs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade,
	CONSTRAINT "device_session_handoffs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_session_handoffs_token_hash_unique" ON "device_session_handoffs" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_session_handoffs_expiry_index" ON "device_session_handoffs" USING btree ("expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "device_enrollment_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"challenge_hash" text NOT NULL,
	"grant_hash" text,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "device_enrollment_grants_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade,
	CONSTRAINT "device_enrollment_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_enrollment_grants_challenge_hash_unique" ON "device_enrollment_grants" USING btree ("challenge_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_enrollment_grants_grant_hash_unique" ON "device_enrollment_grants" USING btree ("grant_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_enrollment_grants_device_index" ON "device_enrollment_grants" USING btree ("device_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_enrollment_grants_expiry_index" ON "device_enrollment_grants" USING btree ("expires_at");
--> statement-breakpoint
ALTER TABLE "device_enrollment_grants" ADD COLUMN IF NOT EXISTS "staged_credential_hash" text;
--> statement-breakpoint
ALTER TABLE "device_enrollment_grants" ADD COLUMN IF NOT EXISTS "staged_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "device_enrollment_grants" ADD COLUMN IF NOT EXISTS "finalized_at" timestamp with time zone;
