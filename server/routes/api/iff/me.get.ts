import { getSession } from "@agent-native/core/server";
import { sql } from "drizzle-orm";
import { defineEventHandler } from "h3";

import { getDb } from "../../../db";
import { GUEST_TTL_MS, dailyLimit, isAdmin, isGuest, isPasskeyAccount } from "../../../iff/access";

// Who is signed in, in the terms the Iff interface needs.
export default defineEventHandler(async (event) => {
  const session = await getSession(event).catch(() => null);
  const email = session?.email;
  if (!email) return { signedIn: false };
  const guest = isGuest(email);
  let expiresAt: string | null = null;
  if (guest) {
    const rows = (await getDb().execute(sql`select created_at from "user" where email = ${email}`)) as unknown as
      | { rows?: { created_at: string | Date }[] }
      | { created_at: string | Date }[];
    const list = Array.isArray(rows) ? rows : (rows.rows ?? []);
    const created = list[0]?.created_at;
    if (created) expiresAt = new Date(new Date(created).getTime() + GUEST_TTL_MS).toISOString();
  }
  const limit = dailyLimit(email);
  return {
    signedIn: true,
    email: guest || isPasskeyAccount(email) ? null : email,
    name: session?.name ?? null,
    passkey: isPasskeyAccount(email),
    guest,
    admin: isAdmin(email),
    expiresAt,
    dailyMessages: Number.isFinite(limit) ? limit : null,
  };
});
