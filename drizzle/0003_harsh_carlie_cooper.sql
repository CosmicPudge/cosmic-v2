CREATE TABLE "provider_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text,
	"display_name" text,
	"email" text,
	"status" text DEFAULT 'connected' NOT NULL,
	"reconnect_required" boolean DEFAULT false NOT NULL,
	"last_successful_refresh_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_credentials" (
	"connection_id" text PRIMARY KEY NOT NULL,
	"encrypted_payload" text NOT NULL,
	"key_version" text DEFAULT 'v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_connections" ADD CONSTRAINT "provider_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_connection_id_provider_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."provider_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_connections_user_id_index" ON "provider_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "provider_connections_user_provider_index" ON "provider_connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_connections_user_provider_account_unique" ON "provider_connections" USING btree ("user_id","provider","provider_account_id");