import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Reused across warm invocations of the same function instance - postgres.js
// manages its own internal connection pool per instance.
// `prepare: false` is required when connecting through Supabase's
// transaction-mode pooler (pgbouncer), which doesn't support prepared
// statements across pooled connections. Harmless for a direct/local
// connection too, so it's left on unconditionally.
export const sql = postgres(connectionString, {
  prepare: false,
  ssl: connectionString.includes("localhost") ? false : "require",
});

export interface UserRow {
  id: number;
  email: string;
  name: string;
  // postgres.js parses timestamptz columns into native Date objects, not
  // strings - JSON.stringify (via res.json()) converts them to ISO strings
  // on the wire automatically.
  created: Date;
  updated: Date;
  last_login: Date | null;
  data: Record<string, unknown>;
}

export interface CredentialRow {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string; // base64-encoded
  attestation_format: string;
  sign_count: number;
  created_at: string;
}
