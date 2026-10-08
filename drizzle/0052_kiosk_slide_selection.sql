ALTER TABLE "kiosk_device_settings"
ADD COLUMN IF NOT EXISTS "slideshow_enabled_slides" jsonb NOT NULL DEFAULT '["clock","calendar","school-calendar","sports","music","garage","notes","tasks","cosmic","system"]'::jsonb;
