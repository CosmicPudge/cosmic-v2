CREATE TABLE IF NOT EXISTS "school_email_proposals" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source_id" text NOT NULL REFERENCES "school_sources"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "connection_id" text NOT NULL,
  "message_id" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "evidence" text NOT NULL,
  "confidence" double precision NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_email_proposals_user_id_index" ON "school_email_proposals" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_email_proposals_source_id_index" ON "school_email_proposals" ("source_id");
--> statement-breakpoint
ALTER TABLE "school_email_proposals" ADD CONSTRAINT "school_email_proposals_status_check" CHECK ("school_email_proposals"."status" in ('pending', 'approved', 'dismissed', 'automatically_applied'));
