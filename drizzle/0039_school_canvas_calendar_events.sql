CREATE TABLE IF NOT EXISTS "school_canvas_calendar_events" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source_id" text NOT NULL,
  "uid" text NOT NULL,
  "recurrence_id" text,
  "title" text NOT NULL,
  "description" text,
  "location" text,
  "url" text,
  "event_type" text NOT NULL,
  "course_id" text,
  "course_match_reason" text,
  "start_at" timestamptz,
  "end_at" timestamptz,
  "status" text,
  "sequence" integer,
  "last_modified" text,
  "dtstamp" text,
  "first_seen_at" timestamptz NOT NULL DEFAULT now(),
  "last_seen_at" timestamptz NOT NULL DEFAULT now(),
  "presence" text NOT NULL DEFAULT 'present',
  "linked_assignment_id" text,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "school_canvas_calendar_events_presence_check" CHECK ("presence" IN ('present', 'missing', 'stale', 'archived'))
);
CREATE INDEX IF NOT EXISTS "school_canvas_calendar_events_user_index" ON "school_canvas_calendar_events" ("user_id");
CREATE INDEX IF NOT EXISTS "school_canvas_calendar_events_source_index" ON "school_canvas_calendar_events" ("user_id", "source_id");
CREATE UNIQUE INDEX IF NOT EXISTS "school_canvas_calendar_events_identity_unique" ON "school_canvas_calendar_events" ("user_id", "id");
