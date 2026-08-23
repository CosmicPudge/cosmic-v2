CREATE TABLE "account_moderation" (
	"account_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"reason" text,
	"internal_note" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_moderation_status_check" CHECK ("account_moderation"."status" in ('active', 'suspended', 'banned'))
);
--> statement-breakpoint
CREATE TABLE "account_roles" (
	"account_id" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "account_roles_account_id_role_pk" PRIMARY KEY("account_id","role"),
	CONSTRAINT "account_roles_role_check" CHECK ("account_roles"."role" in ('user', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_account_id" text,
	"target_account_id" text,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"correlation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_entitlement_overrides" (
	"account_id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_entitlement_overrides_plan_check" CHECK ("admin_entitlement_overrides"."plan" in ('free', 'cosmic_plus'))
);
--> statement-breakpoint
ALTER TABLE "account_moderation" ADD CONSTRAINT "account_moderation_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_entitlement_overrides" ADD CONSTRAINT "admin_entitlement_overrides_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_moderation_status_expires_index" ON "account_moderation" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "account_roles_role_index" ON "account_roles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_index" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_log_target_index" ON "admin_audit_log" USING btree ("target_account_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_actor_index" ON "admin_audit_log" USING btree ("actor_account_id");--> statement-breakpoint
CREATE INDEX "admin_entitlement_overrides_expires_index" ON "admin_entitlement_overrides" USING btree ("expires_at");