import { createHash, randomBytes, randomUUID } from "node:crypto";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb } from "../db";
import { iffInvite, iffUsage } from "../db/schema";

export const GUEST_DOMAIN = "guest.iff.invalid";
// Passkey accounts have no email. Their internal address uses this domain.
export const PASSKEY_DOMAIN = "passkey.iff.invalid";
export const isPasskeyAccount = (email?: string | null) =>
  !!email && email.toLowerCase().endsWith(`@${PASSKEY_DOMAIN}`);
export const GUEST_TTL_MS = 24 * 60 * 60 * 1000;

export const isGuest = (email?: string | null) =>
  !!email && email.toLowerCase().endsWith(`@${GUEST_DOMAIN}`);

// The people who run this deployment. Only they see the framework's builder
// screens (model, database, observability, extensions, team). Set
// IFF_ADMIN_EMAILS to a comma-separated list. Local development with auth
// turned off keeps the dev account as an admin.
export function isAdmin(email?: string | null) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (process.env.NODE_ENV === "development" && e === "dev@local.test") return true;
  return (process.env.IFF_ADMIN_EMAILS ?? "") // guard:allow-env-credential — operator email allowlist, not a credential
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .includes(e);
}

// Paths that belong to the people building and running Iff, not its users.
export const BUILDER_PATHS = [
  "/settings",
  "/database",
  "/observability",
  "/extensions",
  "/team",
  "/agent",
  "/chat",
];
export const isBuilderPath = (path: string) =>
  BUILDER_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

// Daily message allowance on the shared model account.
export function dailyLimit(email: string) {
  if (isAdmin(email)) return Infinity;
  const n = Number(isGuest(email) ? process.env.IFF_GUEST_DAILY_MESSAGES : process.env.IFF_USER_DAILY_MESSAGES); // guard:allow-env-credential — numeric usage caps, not credentials
  return Number.isFinite(n) && n > 0 ? n : isGuest(email) ? 15 : 60;
}

export async function takeMessage(email: string) {
  const limit = dailyLimit(email);
  if (limit === Infinity) return { ok: true, used: 0, limit };
  const owner = email.toLowerCase();
  const day = new Date().toISOString().slice(0, 10);
  const rows = await getDb()
    .insert(iffUsage)
    .values({ owner, day, count: 1 })
    .onConflictDoUpdate({
      target: [iffUsage.owner, iffUsage.day],
      set: { count: sql`${iffUsage.count} + 1` },
    })
    .returning({ count: iffUsage.count });
  const used = rows[0]?.count ?? 1;
  return { ok: used <= limit, used, limit };
}

// Invite links
const INVITE_TTL_DAYS = 30;
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createInvite(owner: string, recipient: string) {
  const token = randomBytes(24).toString("base64url");
  const now = new Date();
  const ttl = isGuest(owner.replace(/^user:/, "")) ? GUEST_TTL_MS : INVITE_TTL_DAYS * 86400000;
  const row = {
    id: randomUUID(),
    tokenHash: hashToken(token),
    owner,
    recipient,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttl),
  };
  await getDb().insert(iffInvite).values(row);
  return { token, id: row.id, recipient, createdAt: row.createdAt, expiresAt: row.expiresAt };
}

export async function listInvites(owner: string) {
  return getDb()
    .select({
      id: iffInvite.id,
      recipient: iffInvite.recipient,
      createdAt: iffInvite.createdAt,
      expiresAt: iffInvite.expiresAt,
      lastViewedAt: iffInvite.lastViewedAt,
    })
    .from(iffInvite)
    .where(and(eq(iffInvite.owner, owner), isNull(iffInvite.revokedAt), gt(iffInvite.expiresAt, new Date())));
}

export async function revokeInvite(owner: string, id: string) {
  await getDb()
    .update(iffInvite)
    .set({ revokedAt: new Date() })
    .where(and(eq(iffInvite.owner, owner), eq(iffInvite.id, id)));
}

export async function revokeAllInvites(owner: string) {
  await getDb()
    .update(iffInvite)
    .set({ revokedAt: new Date() })
    .where(and(eq(iffInvite.owner, owner), isNull(iffInvite.revokedAt)));
}

export async function findInvite(token: string) {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const rows = await getDb()
    .select()
    .from(iffInvite)
    .where(and(eq(iffInvite.tokenHash, hashToken(token)), isNull(iffInvite.revokedAt), gt(iffInvite.expiresAt, new Date())));
  const invite = rows[0];
  if (!invite) return null;
  await getDb().update(iffInvite).set({ lastViewedAt: new Date() }).where(eq(iffInvite.id, invite.id));
  return invite;
}
