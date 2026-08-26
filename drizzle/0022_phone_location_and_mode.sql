ALTER TABLE "kiosk_device_settings" ADD COLUMN "location_mode" text DEFAULT 'account' NOT NULL;
ALTER TABLE "kiosk_device_settings" ADD CONSTRAINT "kiosk_device_settings_location_mode_check" CHECK ("kiosk_device_settings"."location_mode" in ('fixed', 'account', 'follow-phone'));
CREATE TABLE "phone_locations" (
	"user_id" text PRIMARY KEY NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy" double precision,
	"label" text,
	"city" text,
	"region" text,
	"country" text,
	"timezone" text,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "phone_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade,
	CONSTRAINT "phone_locations_latitude_check" CHECK ("phone_locations"."latitude" between -90 and 90),
	CONSTRAINT "phone_locations_longitude_check" CHECK ("phone_locations"."longitude" between -180 and 180)
);
CREATE INDEX "phone_locations_reported_at_index" ON "phone_locations" USING btree ("reported_at");
