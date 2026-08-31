ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_type_check";
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_type_check" CHECK ("school_sources"."source_type" in ('upload-pdf', 'upload-text', 'email', 'calendar', 'manual'));
ALTER TABLE "school_email_proposals" ADD COLUMN IF NOT EXISTS "applied_at" timestamptz;
ALTER TABLE "school_email_proposals" ADD COLUMN IF NOT EXISTS "error" text;
ALTER TABLE "school_email_proposals" DROP CONSTRAINT IF EXISTS "school_email_proposals_status_check";
ALTER TABLE "school_email_proposals" ADD CONSTRAINT "school_email_proposals_status_check" CHECK ("school_email_proposals"."status" in ('pending', 'approved', 'applied', 'dismissed', 'failed', 'needs_target'));
