ALTER TABLE "school_sources" DROP CONSTRAINT IF EXISTS "school_sources_status_check";
--> statement-breakpoint
ALTER TABLE "school_sources" ADD CONSTRAINT "school_sources_status_check" CHECK ("school_sources"."processing_status" in ('uploaded', 'processing', 'ready', 'ready_degraded', 'needs_review', 'failed', 'unsupported'));
