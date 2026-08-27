-- postgres database tables

-- user table
CREATE TABLE "users" (
  "id" serial NOT NULL,
  PRIMARY KEY ("id"),
  "email" text UNIQUE NOT NULL,
  "name" text NOT NULL,
  "created" timestamptz NOT NULL DEFAULT now(),
  "updated" timestamptz NOT NULL DEFAULT now(),
  "data" json NOT NULL
);

-- Credentials (Authenticators) table
CREATE TABLE "credentials" (
  "id" serial NOT NULL,
  PRIMARY KEY ("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credential_id" text UNIQUE NOT NULL, -- Base64 encoded ID from authenticator
  "public_key" text NOT NULL,           -- The public key used for verification
  "attestation_format" text NOT NULL,   -- e.g., 'packed', 'none'
  "sign_count" integer DEFAULT 0,       -- To detect cloned tokens
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_credentials_user_id" ON "credentials"("user_id");
