ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_type_check";
--> statement-breakpoint
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_type_check" CHECK ("school_sources"."source_type" in ('upload-pdf', 'upload-text', 'upload-image', 'upload-docx', 'email', 'calendar', 'manual'));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_notes" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" text,
  "source_id" text REFERENCES "school_sources"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "topics" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "class_date" timestamptz,
  "extraction_method" text NOT NULL DEFAULT 'manual',
  "provenance" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_notes_user_id_index" ON "school_notes" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_notes_source_id_index" ON "school_notes" ("source_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_findings" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source_id" text NOT NULL REFERENCES "school_sources"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "payload" jsonb NOT NULL,
  "evidence" text NOT NULL,
  "confidence" double precision NOT NULL DEFAULT 1,
  "certainty" text NOT NULL DEFAULT 'explicit',
  "review_state" text NOT NULL DEFAULT 'pending',
  "applied_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_findings_user_id_index" ON "school_findings" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_findings_source_id_index" ON "school_findings" ("source_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_assets" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source_id" text NOT NULL REFERENCES "school_sources"("id") ON DELETE CASCADE,
  "original_file_name" text NOT NULL,
  "safe_file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size" integer NOT NULL,
  "storage_provider" text NOT NULL,
  "storage_key" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_assets_user_id_index" ON "school_assets" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "school_assets_storage_key_unique" ON "school_assets" ("storage_provider", "storage_key");
