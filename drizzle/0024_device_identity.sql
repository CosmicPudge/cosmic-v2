ALTER TABLE "devices" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "devices" ADD COLUMN "public_number" text;
ALTER TABLE "devices" ADD COLUMN "credential_hash" text;
ALTER TABLE "devices" ADD COLUMN "credential_revoked_at" timestamp with time zone;
ALTER TABLE "devices" ADD COLUMN "ownership_status" text DEFAULT 'owned' NOT NULL;
WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "id") AS number
  FROM "devices"
  WHERE "public_number" IS NULL
)
UPDATE "devices" AS device
SET "public_number" = 'COSMIC-' || lpad(numbered.number::text, 6, '0')
FROM numbered
WHERE device."id" = numbered."id";
ALTER TABLE "devices" ALTER COLUMN "public_number" SET NOT NULL;
ALTER TABLE "devices" ADD CONSTRAINT "devices_ownership_status_check" CHECK ("ownership_status" in ('owned', 'unclaimed', 'resetting'));
CREATE UNIQUE INDEX "devices_public_number_unique" ON "devices" USING btree ("public_number");
