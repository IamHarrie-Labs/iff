import { integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import type { State } from "../iff/domain";
export const iffWorkspace = pgTable("iff_workspace", {
  id: text("id").primaryKey(),
  state: jsonb("state").$type<State>().notNull(),
});

export const iffUsage = pgTable(
  "iff_usage",
  {
    owner: text("owner").notNull(),
    day: text("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.owner, t.day] })],
);

// A trusted person opens a plan through a private link. Only a hash of the
// link's secret is stored, so a database leak doesn't hand out working links.
export const iffInvite = pgTable("iff_invite", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  owner: text("owner").notNull(),
  recipient: text("recipient").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
});

// Passkeys belong to Iff, not the framework's auth tables. Only the public key
// is stored; the private key never leaves the person's device.
export const iffPasskey = pgTable("iff_passkey", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  transports: text("transports"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

// One-time challenges for a passkey ceremony, valid for five minutes.
export const iffPasskeyChallenge = pgTable("iff_passkey_challenge", {
  id: text("id").primaryKey(),
  challenge: text("challenge").notNull(),
  kind: text("kind").notNull(),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
