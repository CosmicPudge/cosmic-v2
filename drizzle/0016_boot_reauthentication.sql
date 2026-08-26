ALTER TABLE "sessions" ADD COLUMN "authenticated_boot_id" text;
ALTER TABLE "device_pairings" ADD COLUMN "device_id" text;
ALTER TABLE "device_pairings" ADD COLUMN "boot_id" text;
UPDATE "device_pairings" SET "boot_id" = 'legacy' WHERE "boot_id" IS NULL;
ALTER TABLE "device_pairings" ALTER COLUMN "boot_id" SET NOT NULL;
