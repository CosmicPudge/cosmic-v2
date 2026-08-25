CREATE TABLE "finance_duplicate_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source_external_transaction_id" text NOT NULL,
	"duplicate_external_transaction_id" text NOT NULL,
	"decision" text NOT NULL,
	"confidence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "finance_duplicate_decisions_decision_check" CHECK ("finance_duplicate_decisions"."decision" in ('keep_both', 'treat_duplicate'))
);
--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" DROP CONSTRAINT "finance_sync_jobs_status_check";--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" ADD COLUMN "lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" ADD COLUMN "next_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "finance_duplicate_decisions" ADD CONSTRAINT "finance_duplicate_decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_duplicate_decisions" ADD CONSTRAINT "finance_duplicate_decisions_source_external_transaction_id_finance_external_transactions_id_fk" FOREIGN KEY ("source_external_transaction_id") REFERENCES "public"."finance_external_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_duplicate_decisions" ADD CONSTRAINT "finance_duplicate_decisions_duplicate_external_transaction_id_finance_external_transactions_id_fk" FOREIGN KEY ("duplicate_external_transaction_id") REFERENCES "public"."finance_external_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finance_duplicate_decisions_user_index" ON "finance_duplicate_decisions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "finance_duplicate_decisions_pair_unique" ON "finance_duplicate_decisions" USING btree ("user_id","source_external_transaction_id","duplicate_external_transaction_id");--> statement-breakpoint
CREATE INDEX "finance_sync_jobs_claim_index" ON "finance_sync_jobs" USING btree ("status","next_attempt_at","lease_expires_at");--> statement-breakpoint
ALTER TABLE "finance_sync_jobs" ADD CONSTRAINT "finance_sync_jobs_status_check" CHECK ("finance_sync_jobs"."status" in ('queued', 'processing', 'retry', 'completed', 'failed', 'cancelled'));