CREATE TABLE "account_entitlements" (
	"user_id" text PRIMARY KEY NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"source" text DEFAULT 'account' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_entitlements_plan_check" CHECK ("account_entitlements"."plan" in ('free', 'cosmic_plus')),
	CONSTRAINT "account_entitlements_source_check" CHECK ("account_entitlements"."source" in ('account', 'development-override'))
);
--> statement-breakpoint
ALTER TABLE "account_entitlements" ADD CONSTRAINT "account_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;