ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password_salt" DROP NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account_identities" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "provider_subject" text NOT NULL,
  "email" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_used_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_identities_provider_subject_unique" ON "account_identities" ("provider", "provider_subject");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_identities_account_id_index" ON "account_identities" ("account_id");
--> statement-breakpoint
ALTER TABLE "account_identities" ADD CONSTRAINT "account_identities_provider_check" CHECK ("account_identities"."provider" in ('password', 'google', 'microsoft', 'apple'));
--> statement-breakpoint
INSERT INTO "account_identities" ("id", "account_id", "provider", "provider_subject", "email")
SELECT 'identity_' || "users"."id", "users"."id", 'password', "users"."id", "users"."email"
FROM "users" WHERE NOT EXISTS (SELECT 1 FROM "account_identities" WHERE "account_identities"."account_id" = "users"."id" AND "account_identities"."provider" = 'password');
