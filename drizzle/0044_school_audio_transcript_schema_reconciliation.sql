ALTER TABLE "school_audio_transcripts" ALTER COLUMN "asset_id" DROP NOT NULL;
ALTER TABLE "school_audio_transcripts" ADD COLUMN IF NOT EXISTS "source_type" text NOT NULL DEFAULT 'cosmic_transcription';
ALTER TABLE "school_audio_transcripts" ADD COLUMN IF NOT EXISTS "source_label" text;
ALTER TABLE "school_audio_transcripts" ADD COLUMN IF NOT EXISTS "audio_cleanup_status" text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE "school_audio_transcripts" ADD COLUMN IF NOT EXISTS "audio_deleted_at" timestamptz;
ALTER TABLE "school_audio_transcripts" DROP CONSTRAINT IF EXISTS "school_audio_cleanup_status_check";
ALTER TABLE "school_audio_transcripts" ADD CONSTRAINT "school_audio_cleanup_status_check" CHECK ("audio_cleanup_status" in ('not_applicable', 'uploaded', 'processing', 'transcribed', 'deletion_pending', 'deleted'));
