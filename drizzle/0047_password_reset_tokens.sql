CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_hash_unique" ON "password_reset_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_index" ON "password_reset_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_index" ON "password_reset_tokens" ("expires_at");
