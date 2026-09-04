CREATE TABLE IF NOT EXISTS "school_study_sets" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" text,
  "title" text NOT NULL,
  "description" text,
  "provenance" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "school_study_sets_account_index" ON "school_study_sets" ("account_id");
CREATE INDEX IF NOT EXISTS "school_study_sets_course_index" ON "school_study_sets" ("account_id", "course_id");
CREATE TABLE IF NOT EXISTS "school_flashcards" (
  "id" text PRIMARY KEY NOT NULL,
  "set_id" text NOT NULL REFERENCES "school_study_sets"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "front" text NOT NULL,
  "back" text NOT NULL,
  "notes" text,
  "review_count" integer NOT NULL DEFAULT 0,
  "interval_days" integer NOT NULL DEFAULT 0,
  "last_reviewed_at" timestamptz,
  "next_review_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "school_flashcards_set_index" ON "school_flashcards" ("set_id");
CREATE INDEX IF NOT EXISTS "school_flashcards_account_review_index" ON "school_flashcards" ("account_id", "next_review_at");
CREATE TABLE IF NOT EXISTS "school_resources" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "course_id" text,
  "title" text NOT NULL,
  "url" text,
  "reference" text,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "school_resources_url_or_reference_check" CHECK ("url" IS NOT NULL OR "reference" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS "school_resources_account_index" ON "school_resources" ("account_id");
CREATE INDEX IF NOT EXISTS "school_resources_course_index" ON "school_resources" ("account_id", "course_id");
