import { randomBytes, randomUUID } from "node:crypto";

import {
  createBetterAuthSessionForEmail,
  getSession,
  setBetterAuthSessionCookie,
} from "@agent-native/core/server";
import {
  type RegistrationResponseJSON,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { and, eq, gt, sql } from "drizzle-orm";
import {
  type H3Event,
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  getRequestHeader,
  getRequestURL,
  getRouterParam,
  readBody,
  setCookie,
} from "h3";

import { getDb } from "../../../../db";
import { iffPasskey, iffPasskeyChallenge } from "../../../../db/schema";
import { PASSKEY_DOMAIN, isGuest } from "../../../../iff/access";
import { ownerKey, readState, changeState } from "../../../../iff/store";

// Passkey accounts. No email and no password: the passkey is the account.
// Steps: register-options -> register-verify, login-options -> login-verify.
const COOKIE = "iff_pk";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64url");
const unb64 = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));

function where(event: H3Event) {
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  return { rpID: url.hostname, origin: url.origin, secure: url.protocol === "https:" };
}

async function saveChallenge(event: H3Event, challenge: string, kind: string, userId?: string) {
  const id = randomUUID();
  const db = getDb();
  await db.delete(iffPasskeyChallenge).where(sql`created_at < ${new Date(Date.now() - CHALLENGE_TTL_MS)}`);
  await db.insert(iffPasskeyChallenge).values({ id, challenge, kind, userId: userId ?? null, createdAt: new Date() });
  setCookie(event, COOKIE, id, {
    httpOnly: true,
    sameSite: "strict",
    secure: where(event).secure,
    path: "/api/iff/passkey",
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

// A challenge works once, for one kind of ceremony, within five minutes.
async function takeChallenge(event: H3Event, kind: string) {
  const id = getCookie(event, COOKIE);
  deleteCookie(event, COOKIE, { path: "/api/iff/passkey" });
  if (!id) throw createError({ statusCode: 400, statusMessage: "That took too long. Try again." });
  const rows = await getDb()
    .delete(iffPasskeyChallenge)
    .where(
      and(
        eq(iffPasskeyChallenge.id, id),
        eq(iffPasskeyChallenge.kind, kind),
        gt(iffPasskeyChallenge.createdAt, new Date(Date.now() - CHALLENGE_TTL_MS)),
      ),
    )
    .returning();
  const row = rows[0];
  if (!row) throw createError({ statusCode: 400, statusMessage: "That took too long. Try again." });
  return row;
}

async function signIn(event: H3Event, email: string) {
  const session = await createBetterAuthSessionForEmail(email);
  if (!session) throw createError({ statusCode: 503, statusMessage: "Sign-in is unavailable right now." });
  await setBetterAuthSessionCookie(event, session.token);
}

export default defineEventHandler(async (event) => {
  const site = getRequestHeader(event, "sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none")
    throw createError({ statusCode: 403, statusMessage: "Cross-site request refused" });

  const step = getRouterParam(event, "step");
  const { rpID, origin } = where(event);

  if (step === "register-options") {
    const body = ((await readBody(event).catch(() => ({}))) ?? {}) as { name?: unknown };
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 40) : "Iff";
    const userId = randomBytes(16);
    const options = await generateRegistrationOptions({
      rpName: "Iff",
      rpID,
      userName: name,
      userDisplayName: name,
      userID: userId,
      attestationType: "none",
      authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    });
    await saveChallenge(event, options.challenge, "register", `${b64(userId)}|${name}`);
    return options;
  }

  if (step === "register-verify") {
    const row = await takeChallenge(event, "register");
    const [userIdB64 = "", name = "Iff"] = (row.userId ?? "").split("|");
    const response = (await readBody(event)) as RegistrationResponseJSON;
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge: row.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    }).catch(() => ({ verified: false as const }));
    if (!result.verified) throw createError({ statusCode: 400, statusMessage: "The passkey couldn’t be checked. Try again." });

    const { credential } = result.registrationInfo;
    const hex = Buffer.from(userIdB64, "base64url").toString("hex");
    const email = `member-${hex.slice(0, 20)}@${PASSKEY_DOMAIN}`;
    const now = new Date();
    const db = getDb();
    await db.execute(
      sql`insert into "user" (id, name, email, email_verified, two_factor_enabled, created_at, updated_at)
          values (${randomUUID()}, ${name}, ${email}, ${false}, ${false}, ${now}, ${now})`,
    );
    await db.insert(iffPasskey).values({
      id: credential.id,
      ownerEmail: email,
      publicKey: b64(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports?.join(",") ?? null,
      createdAt: now,
    });

    // A guest who saves their sample workspace keeps everything they did in it.
    const current = await getSession(event).catch(() => null);
    if (current?.email && isGuest(current.email)) {
      const state = await readState(ownerKey(current.email));
      await changeState(() => state, ownerKey(email));
    }

    await signIn(event, email);
    return { ok: true, redirect: "/home" };
  }

  if (step === "login-options") {
    const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred" });
    await saveChallenge(event, options.challenge, "login");
    return options;
  }

  if (step === "login-verify") {
    const row = await takeChallenge(event, "login");
    const response = (await readBody(event)) as { id?: string };
    const found = response?.id
      ? (await getDb().select().from(iffPasskey).where(eq(iffPasskey.id, response.id)))[0]
      : undefined;
    if (!found) throw createError({ statusCode: 400, statusMessage: "This passkey isn’t registered with Iff." });
    const result = await verifyAuthenticationResponse({
      response: response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge: row.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: found.id,
        publicKey: unb64(found.publicKey),
        counter: found.counter,
        ...(found.transports ? { transports: found.transports.split(",") } : {}),
      },
      requireUserVerification: false,
    }).catch(() => ({ verified: false as const }));
    if (!result.verified) throw createError({ statusCode: 400, statusMessage: "The passkey couldn’t be checked. Try again." });
    await getDb()
      .update(iffPasskey)
      .set({ counter: result.authenticationInfo.newCounter, lastUsedAt: new Date() })
      .where(eq(iffPasskey.id, found.id));
    await signIn(event, found.ownerEmail);
    return { ok: true, redirect: "/home" };
  }

  throw createError({ statusCode: 404, statusMessage: "Unknown step" });
});
