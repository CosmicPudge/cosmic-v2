ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_type_check";
--> statement-breakpoint
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_type_check" CHECK ("school_sources"."source_type" in ('upload-pdf', 'upload-text', 'upload-image', 'upload-docx', 'email', 'calendar', 'manual'));
