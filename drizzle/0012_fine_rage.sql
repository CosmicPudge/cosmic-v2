CREATE TABLE "finance_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"environment" text NOT NULL,
	"institution_id" text,
	"institution_name" text,
	"status" text DEFAULT 'connected' NOT NULL,
	"reconnect_required" boolean DEFAULT false NOT NULL,
	"last_successful_sync_at" timestamp with time zone,
	"last_attempted_sync_at" timestamp with time zone,
	"error_category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_connections_environment_check" CHECK ("finance_connections"."environment" in ('sandbox', 'development', 'production')),
	CONSTRAINT "finance_connections_status_check" CHECK ("finance_connections"."status" in ('connected', 'syncing', 'up_to_date', 'needs_attention', 'reconnect_required', 'provider_unavailable', 'disconnected'))
);
--> statement-breakpoint
CREATE TABLE "finance_external_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"manual_account_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"subtype" text,
	"mask" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"current_balance_minor" integer,
	"available_balance_minor" integer,
	"credit_limit_minor" integer,
	"status" text DEFAULT 'connected' NOT NULL,
	"last_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_external_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"external_account_id" text NOT NULL,
	"provider_transaction_id" text NOT NULL,
	"pending_provider_transaction_id" text,
	"posted_date" text,
	"authorized_date" text,
	"description" text NOT NULL,
	"merchant" text,
	"amount_minor" integer NOT NULL,
	"direction" text NOT NULL,
	"status" text NOT NULL,
	"provider_category" text,
	"payment_channel" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"removed" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_external_transactions_direction_check" CHECK ("finance_external_transactions"."direction" in ('income', 'expense', 'transfer')),
	CONSTRAINT "finance_external_transactions_status_check" CHECK ("finance_external_transactions"."status" in ('pending', 'cleared'))
);
--> statement-breakpoint
CREATE TABLE "finance_sync_state" (
	"connection_id" text PRIMARY KEY NOT NULL,
	"cursor" text,
	"initial_sync_complete" boolean DEFAULT false NOT NULL,
	"historical_sync_complete" boolean DEFAULT false NOT NULL,
	"last_attempted_at" timestamp with time zone,
	"last_successful_at" timestamp with time zone,
	"next_allowed_at" timestamp with time zone,
	"error_category" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_connections" ADD CONSTRAINT "finance_connections_id_provider_connections_id_fk" FOREIGN KEY ("id") REFERENCES "public"."provider_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_connections" ADD CONSTRAINT "finance_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_external_accounts" ADD CONSTRAINT "finance_external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_external_accounts" ADD CONSTRAINT "finance_external_accounts_connection_id_finance_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."finance_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_external_transactions" ADD CONSTRAINT "finance_external_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_external_transactions" ADD CONSTRAINT "finance_external_transactions_connection_id_finance_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."finance_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_external_transactions" ADD CONSTRAINT "finance_external_transactions_external_account_id_finance_external_accounts_id_fk" FOREIGN KEY ("external_account_id") REFERENCES "public"."finance_external_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_sync_state" ADD CONSTRAINT "finance_sync_state_connection_id_finance_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."finance_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finance_connections_user_index" ON "finance_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_connections_user_provider_institution_unique" ON "finance_connections" USING btree ("user_id","provider","environment","institution_id");--> statement-breakpoint
CREATE INDEX "finance_external_accounts_user_index" ON "finance_external_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "finance_external_accounts_connection_index" ON "finance_external_accounts" USING btree ("connection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_external_accounts_provider_id_unique" ON "finance_external_accounts" USING btree ("connection_id","provider_account_id");--> statement-breakpoint
CREATE INDEX "finance_external_transactions_user_date_index" ON "finance_external_transactions" USING btree ("user_id","posted_date");--> statement-breakpoint
CREATE INDEX "finance_external_transactions_account_date_index" ON "finance_external_transactions" USING btree ("external_account_id","posted_date");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_external_transactions_provider_id_unique" ON "finance_external_transactions" USING btree ("connection_id","provider_transaction_id");--> statement-breakpoint
