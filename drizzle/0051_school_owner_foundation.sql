ALTER TABLE "school_sources" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_sources_owner_id_index" ON "school_sources" ("owner_id");

ALTER TABLE "school_notes" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_notes_owner_id_index" ON "school_notes" ("owner_id");

ALTER TABLE "school_assignments" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_assignments_owner_id_index" ON "school_assignments" ("owner_id");

ALTER TABLE "school_study_sets" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_study_sets_owner_id_index" ON "school_study_sets" ("owner_id");

ALTER TABLE "school_resources" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_resources_owner_id_index" ON "school_resources" ("owner_id");

ALTER TABLE "school_course_plan_overrides" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_course_plan_overrides_owner_id_index" ON "school_course_plan_overrides" ("owner_id");

ALTER TABLE "school_canvas_calendar_events" ADD COLUMN IF NOT EXISTS "owner_id" text REFERENCES "cosmic_owners"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "school_canvas_calendar_events_owner_id_index" ON "school_canvas_calendar_events" ("owner_id");
