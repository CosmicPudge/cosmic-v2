CREATE TABLE "clock_alarms" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" text NOT NULL,
	"time" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"repeat_weekdays" integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
	"snooze_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clock_alarms" ADD CONSTRAINT "clock_alarms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "clock_alarms_user_id_index" ON "clock_alarms" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "clock_alarms_user_id_alarm_id_unique" ON "clock_alarms" USING btree ("user_id","id");
