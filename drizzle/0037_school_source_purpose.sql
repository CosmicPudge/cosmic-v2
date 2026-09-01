ALTER TABLE "school_sources" ADD COLUMN IF NOT EXISTS "source_purpose" text NOT NULL DEFAULT 'unknown';
