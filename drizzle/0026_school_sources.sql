CREATE TABLE IF NOT EXISTS "school_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"category" text,
	"original_file_name" text,
	"mime_type" text,
	"file_size" integer,
	"source_date" timestamp with time zone,
	"notes" text,
	"extracted_text" text,
	"intelligence" jsonb,
	"processing_status" text DEFAULT 'uploaded' NOT NULL,
	"processing_version" integer DEFAULT 1 NOT NULL,
	"processing_error" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade,
	CONSTRAINT "school_sources_type_check" CHECK ("school_sources"."source_type" in ('upload-pdf', 'upload-text', 'manual')),
	CONSTRAINT "school_sources_status_check" CHECK ("school_sources"."processing_status" in ('uploaded', 'processing', 'ready', 'needs_review', 'failed', 'unsupported'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_sources_user_id_index" ON "school_sources" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "school_sources_status_index" ON "school_sources" USING btree ("processing_status");
