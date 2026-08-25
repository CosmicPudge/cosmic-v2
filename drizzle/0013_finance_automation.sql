CREATE TABLE "finance_goal_contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" text NOT NULL,
	"manual_transaction_id" text,
	"external_transaction_id" text,
	"amount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_savings_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"target_amount_minor" integer NOT NULL,
	"target_date" text,
	"progress_mode" text NOT NULL,
	"linked_account_id" text,
	"manual_assigned_minor" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_savings_goals_mode_check" CHECK ("finance_savings_goals"."progress_mode" in ('manual', 'dedicated_account', 'contributions'))
);
--> statement-breakpoint
CREATE TABLE "finance_sync_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error_category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "finance_sync_jobs_status_check" CHECK ("finance_sync_jobs"."status" in ('queued', 'processing', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "finance_transaction_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"external_transaction_id" text NOT NULL,
	"category_id" text,
	"notes" text,
	"ignored" boolean DEFAULT false NOT NULL,
	"is_subscription" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transfer_pairs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_external_transaction_id" text NOT NULL,
	"destination_external_transaction_id" text NOT NULL,
	"confidence" integer NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_goal_contributions" ADD CONSTRAINT "finance_goal_contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_goal_contributions" ADD CONSTRAINT "finance_goal_contributions_goal_id_finance_savings_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."finance_savings_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_goal_contributions" ADD CONSTRAINT "finance_goal_contributions_external_transaction_id_finance_external_transactions_id_fk" FOREIGN KEY ("external_transaction_id") REFERENCES "public"."finance_external_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_savings_goals" ADD CONSTRAINT "finance_savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" ADD CONSTRAINT "finance_sync_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" ADD CONSTRAINT "finance_sync_jobs_connection_id_finance_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."finance_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transaction_overrides" ADD CONSTRAINT "finance_transaction_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transaction_overrides" ADD CONSTRAINT "finance_transaction_overrides_external_transaction_id_finance_external_transactions_id_fk" FOREIGN KEY ("external_transaction_id") REFERENCES "public"."finance_external_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transfer_pairs" ADD CONSTRAINT "finance_transfer_pairs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transfer_pairs" ADD CONSTRAINT "finance_transfer_pairs_source_external_transaction_id_finance_external_transactions_id_fk" FOREIGN KEY ("source_external_transaction_id") REFERENCES "public"."finance_external_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transfer_pairs" ADD CONSTRAINT "finance_transfer_pairs_destination_external_transaction_id_finance_external_transactions_id_fk" FOREIGN KEY ("destination_external_transaction_id") REFERENCES "public"."finance_external_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finance_goal_contributions_user_index" ON "finance_goal_contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "finance_goal_contributions_goal_index" ON "finance_goal_contributions" USING btree ("goal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_goal_contributions_external_unique" ON "finance_goal_contributions" USING btree ("goal_id","external_transaction_id");--> statement-breakpoint
CREATE INDEX "finance_savings_goals_user_index" ON "finance_savings_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "finance_sync_jobs_user_index" ON "finance_sync_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "finance_sync_jobs_connection_status_index" ON "finance_sync_jobs" USING btree ("connection_id","status");--> statement-breakpoint
CREATE INDEX "finance_transaction_overrides_user_index" ON "finance_transaction_overrides" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_transaction_overrides_transaction_unique" ON "finance_transaction_overrides" USING btree ("user_id","external_transaction_id");--> statement-breakpoint
CREATE INDEX "finance_transfer_pairs_user_index" ON "finance_transfer_pairs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_transfer_pairs_source_unique" ON "finance_transfer_pairs" USING btree ("source_external_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_transfer_pairs_destination_unique" ON "finance_transfer_pairs" USING btree ("destination_external_transaction_id");