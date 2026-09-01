CREATE TABLE IF NOT EXISTS "school_course_plan_overrides" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" text NOT NULL,
  "semantic_field" text NOT NULL,
  "target_id" text DEFAULT 'primary' NOT NULL,
  "value" jsonb NOT NULL,
  "note" text,
  "provenance" text DEFAULT 'manual' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "school_course_plan_overrides_provenance_check" CHECK ("provenance" = 'manual')
);
CREATE INDEX IF NOT EXISTS "school_course_plan_overrides_account_course_index" ON "school_course_plan_overrides" ("account_id", "course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "school_course_plan_overrides_identity_unique" ON "school_course_plan_overrides" ("account_id", "course_id", "semantic_field", "target_id");
