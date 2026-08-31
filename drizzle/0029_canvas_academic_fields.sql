ALTER TABLE "school_assignments" ADD COLUMN IF NOT EXISTS "published" boolean;
--> statement-breakpoint
ALTER TABLE "school_assignments" ADD COLUMN IF NOT EXISTS "canvas_url" text;
--> statement-breakpoint
ALTER TABLE "school_assignments" DROP CONSTRAINT IF EXISTS "school_assignments_completion_status_check";
--> statement-breakpoint
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_completion_status_check" CHECK ("school_assignments"."completion_status" in ('upcoming', 'due_soon', 'overdue', 'completed', 'submitted', 'graded', 'missing', 'unknown'));
