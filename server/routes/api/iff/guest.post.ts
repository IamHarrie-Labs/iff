import { randomUUID } from "node:crypto";

import {
  createBetterAuthSessionForEmail,
  getSession,
  setBetterAuthSessionCookie,
} from "@agent-native/core/server";
import { sql } from "drizzle-orm";
import { createError, defineEventHandler, getRequestHeader } from "h3";

import { getDb } from "../../../db";
import { demo } from "../../../iff/domain";
import { GUEST_DOMAIN, GUEST_TTL_MS as TTL_MS } from "../../../iff/access";
import { changeState, ownerKey } from "../../../iff/store";

// A private, throwaway workspace filled with the fictional sample household.
// No sign-up: we create a guest user, give the browser a 24-hour session and
// remove the guest and everything it touched once that day is up.

async function sweepExpiredGuests() {
  const db = getDb();
  const cutoff = new Date(Date.now() - TTL_MS);
  const like = `%@${GUEST_DOMAIN}`;
  await db.execute(
    sql`delete from iff_workspace where id like ${`user:${like}`} and id in (
      select 'user:' || email from "user" where email like ${like} and created_at < ${cutoff})`,
  );
  await db.execute(
    sql`delete from iff_invite where owner like ${`user:${like}`} and created_at < ${cutoff}`,
  );
  // Message counts are kept for 30 days, as the privacy notice says.
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  await db.execute(sql`delete from iff_usage where day < ${monthAgo}`);
  await db.execute(
    sql`delete from "session" where user_id in (select id from "user" where email like ${like} and created_at < ${cutoff})`,
  );
  await db.execute(sql`delete from "user" where email like ${like} and created_at < ${cutoff}`);
}

export default defineEventHandler(async (event) => {
  // Cookies are set here, so only accept same-site form or fetch posts.
  const site = getRequestHeader(event, "sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    throw createError({ statusCode: 403, statusMessage: "Cross-site request refused" });

  // Anyone already signed in, guest or not, keeps their workspace and session.
  const current = await getSession(event).catch(() => null);
  const authOff = process.env.AUTH_DISABLED === "true"; // guard:allow-env-credential — framework auth mode flag, not a credential
  if (current?.email && !authOff)
    return { ok: true, redirect: "/home" };

  await sweepExpiredGuests().catch((e) => console.warn("[iff] guest sweep failed", e));

  const id = randomUUID();
  const email = `guest-${id.slice(0, 12)}@${GUEST_DOMAIN}`;
  const now = new Date();
  await getDb().execute(
    sql`insert into "user" (id, name, email, email_verified, two_factor_enabled, created_at, updated_at)
        values (${id}, ${"Guest"}, ${email}, ${false}, ${false}, ${now}, ${now})`,
  );

  const session = await createBetterAuthSessionForEmail(email, undefined, {
    expiresAt: new Date(now.getTime() + TTL_MS),
  });
  if (!session) throw createError({ statusCode: 503, statusMessage: "Guest sign-in is unavailable" });

  await changeState(() => demo(), ownerKey(email));
  await setBetterAuthSessionCookie(event, session.token);
  return { ok: true, redirect: "/home" };
});
