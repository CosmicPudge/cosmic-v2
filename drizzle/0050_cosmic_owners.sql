CREATE TABLE IF NOT EXISTS "cosmic_owners" (
  "id" text PRIMARY KEY NOT NULL,
  "kind" text NOT NULL,
  "external_key" text NOT NULL,
  "legacy_account_id" text REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cosmic_owners_kind_check" CHECK ("kind" in ('personal', 'legacy-account')),
  CONSTRAINT "cosmic_owners_identity_check" CHECK (
    ("kind" = 'personal' and "external_key" = 'personal' and "legacy_account_id" is null)
    or
    ("kind" = 'legacy-account' and "legacy_account_id" is not null and "external_key" = "legacy_account_id")
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS "cosmic_owners_kind_external_key_unique" ON "cosmic_owners" ("kind", "external_key");
CREATE UNIQUE INDEX IF NOT EXISTS "cosmic_owners_legacy_account_id_unique" ON "cosmic_owners" ("legacy_account_id") WHERE "legacy_account_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "cosmic_owners_kind_index" ON "cosmic_owners" ("kind");

INSERT INTO "cosmic_owners" ("id", "kind", "external_key")
VALUES ('owner-personal', 'personal', 'personal')
ON CONFLICT ("kind", "external_key") DO NOTHING;
