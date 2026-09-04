ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_type_check";
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_type_check" CHECK ("school_sources"."source_type" in ('upload-pdf', 'upload-text', 'upload-image', 'upload-docx', 'voice-recording', 'apple_voice_memos_transcript', 'manual_transcript', 'other_transcript', 'email', 'calendar', 'manual'));
