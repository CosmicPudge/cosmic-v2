CREATE TABLE IF NOT EXISTS "school_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "course_id" text,
  "course_name" text,
  "source_type" text NOT NULL,
  "source_id" text,
  "external_id" text,
  "due_at" timestamptz,
  "available_at" timestamptz,
  "lock_at" timestamptz,
  "completion_status" text NOT NULL DEFAULT 'unknown',
  "planning_status" text NOT NULL DEFAULT 'not_started',
  "priority" text NOT NULL DEFAULT 'normal',
  "estimated_minutes" integer,
  "points_possible" double precision,
  "personal_notes" text,
  "provenance" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_synced_at" timestamptz,
  "source_updated_at" timestamptz
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_assignments_user_id_index" ON "school_assignments" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_assignments_due_at_index" ON "school_assignments" ("user_id", "due_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "school_assignments_source_identity_unique" ON "school_assignments" ("user_id", "source_type", "source_id", "external_id");
--> statement-breakpoint
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_source_type_check" CHECK ("school_assignments"."source_type" in ('canvas-api', 'canvas-calendar', 'school-source', 'manual'));
--> statement-breakpoint
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_completion_status_check" CHECK ("school_assignments"."completion_status" in ('upcoming', 'due_soon', 'overdue', 'completed', 'submitted', 'missing', 'unknown'));
--> statement-breakpoint
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_planning_status_check" CHECK ("school_assignments"."planning_status" in ('not_started', 'planned', 'in_progress', 'done'));
--> statement-breakpoint
ALTER TABLE "school_assignments" ADD CONSTRAINT "school_assignments_priority_check" CHECK ("school_assignments"."priority" in ('low', 'normal', 'high', 'critical'));
