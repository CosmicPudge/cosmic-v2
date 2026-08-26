ALTER TABLE "kiosk_device_settings" ADD COLUMN "reported_location_latitude" double precision;
ALTER TABLE "kiosk_device_settings" ADD COLUMN "reported_location_longitude" double precision;
ALTER TABLE "kiosk_device_settings" ADD COLUMN "reported_location_label" text;
ALTER TABLE "kiosk_device_settings" ADD COLUMN "reported_location_region" text;
ALTER TABLE "kiosk_device_settings" ADD COLUMN "reported_location_country" text;
ALTER TABLE "kiosk_device_settings" ADD COLUMN "reported_location_timezone" text;
