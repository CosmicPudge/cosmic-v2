ALTER TABLE "kiosk_device_settings" ADD COLUMN "setup_preview" text DEFAULT 'normal' NOT NULL;
ALTER TABLE "kiosk_device_settings" ADD COLUMN "night_dim_preview" boolean DEFAULT false NOT NULL;
ALTER TABLE "kiosk_device_settings" ADD CONSTRAINT "kiosk_device_settings_preview_check" CHECK ("setup_preview" in ('normal', 'fit', 'clock', 'weather', 'calendar'));
