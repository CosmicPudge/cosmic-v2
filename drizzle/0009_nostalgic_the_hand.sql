CREATE TABLE "support_report_events" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"actor_account_id" text,
	"kind" text NOT NULL,
	"from_status" text,
	"to_status" text,
	"internal_note" text,
	"user_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_report_events_kind_check" CHECK ("support_report_events"."kind" in ('status', 'note'))
);
--> statement-breakpoint
CREATE TABLE "support_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"public_reference" text NOT NULL,
	"account_id" text,
	"type" text NOT NULL,
	"module" text NOT NULL,
	"severity" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"expected_behavior" text,
	"reproduction_steps" text,
	"notes" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"diagnostics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attachment_ref" text,
	"user_visible_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "support_reports_type_check" CHECK ("support_reports"."type" in ('bug', 'feature', 'feedback')),
	CONSTRAINT "support_reports_module_check" CHECK ("support_reports"."module" in ('Dashboard', 'Sports', 'Garage', 'Finance', 'Calendar', 'Mail', 'Music', 'Context', 'Search', 'Notes', 'Projects', 'Account', 'Settings', 'Billing', 'Other')),
	CONSTRAINT "support_reports_severity_check" CHECK ("support_reports"."severity" is null or "support_reports"."severity" in ('cosmetic', 'annoying', 'broken', 'unusable')),
	CONSTRAINT "support_reports_status_check" CHECK ("support_reports"."status" in ('submitted', 'reviewing', 'needs_info', 'fixing', 'fixed', 'closed'))
);
--> statement-breakpoint
ALTER TABLE "support_report_events" ADD CONSTRAINT "support_report_events_report_id_support_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."support_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_reports" ADD CONSTRAINT "support_reports_account_id_users_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_report_events_report_index" ON "support_report_events" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "support_reports_public_reference_unique" ON "support_reports" USING btree ("public_reference");--> statement-breakpoint
CREATE INDEX "support_reports_account_index" ON "support_reports" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "support_reports_status_index" ON "support_reports" USING btree ("status");