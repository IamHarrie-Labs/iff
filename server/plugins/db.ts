import { runMigrations } from "@agent-native/core/db";
export default runMigrations(
  [
    {
      version: 1,
      name: "iff-workspace",
      sql: "CREATE TABLE IF NOT EXISTS iff_workspace (id TEXT PRIMARY KEY, state JSONB NOT NULL);",
    },
    {
      version: 2,
      name: "iff-usage",
      sql: "CREATE TABLE IF NOT EXISTS iff_usage (owner TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (owner, day));",
    },
    {
      version: 3,
      name: "iff-invite",
      sql: "CREATE TABLE IF NOT EXISTS iff_invite (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, owner TEXT NOT NULL, recipient TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ, last_viewed_at TIMESTAMPTZ);",
    },
    {
      version: 4,
      name: "iff-invite-owner-index",
      sql: "CREATE INDEX IF NOT EXISTS iff_invite_owner ON iff_invite (owner);",
    },
    {
      version: 5,
      name: "iff-passkey",
      sql: "CREATE TABLE IF NOT EXISTS iff_passkey (id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, public_key TEXT NOT NULL, counter INTEGER NOT NULL DEFAULT 0, transports TEXT, created_at TIMESTAMPTZ NOT NULL, last_used_at TIMESTAMPTZ);",
    },
    {
      version: 6,
      name: "iff-passkey-challenge",
      sql: "CREATE TABLE IF NOT EXISTS iff_passkey_challenge (id TEXT PRIMARY KEY, challenge TEXT NOT NULL, kind TEXT NOT NULL, user_id TEXT, created_at TIMESTAMPTZ NOT NULL);",
    },
  ],
  { table: "iff_migrations" },
);
