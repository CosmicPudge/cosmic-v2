ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_type_check";
--> statement-breakpoint
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_type_check" CHECK ("school_sources"."source_type" in ('upload-pdf', 'upload-text', 'upload-image', 'upload-docx', 'voice-recording', 'email', 'calendar', 'manual'));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "school_audio_transcripts" (
  "id" text PRIMARY KEY NOT NULL, "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "source_id" text NOT NULL REFERENCES "school_sources"("id") ON DELETE CASCADE, "asset_id" text NOT NULL REFERENCES "school_assets"("id") ON DELETE CASCADE, "course_id" text, "transcript" text, "segments" jsonb, "provider" text, "model" text, "organized_content" text, "organized_topics" jsonb, "title" text, "status" text NOT NULL DEFAULT 'uploaded', "processing_error" text, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "school_audio_transcripts_status_check" CHECK ("status" in ('uploaded', 'transcribing', 'transcribed', 'organizing', 'ready-for-review', 'approved', 'failed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_audio_transcripts_user_index" ON "school_audio_transcripts" ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "school_audio_transcripts_source_unique" ON "school_audio_transcripts" ("source_id");
