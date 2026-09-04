ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_type_check";
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_type_check" CHECK ("source_type" in ('upload-pdf', 'upload-text', 'upload-image', 'upload-docx', 'voice-recording', 'apple_voice_memos_transcript', 'manual_transcript', 'other_transcript', 'email', 'calendar', 'manual'));
ALTER TABLE "school_audio_transcripts" DROP CONSTRAINT IF EXISTS "school_audio_transcripts_asset_id_fkey";
ALTER TABLE "school_audio_transcripts" DROP CONSTRAINT IF EXISTS "school_audio_transcripts_asset_id_school_assets_id_fk";
ALTER TABLE "school_audio_transcripts" ADD CONSTRAINT "school_audio_transcripts_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "school_assets"("id") ON DELETE SET NULL;
