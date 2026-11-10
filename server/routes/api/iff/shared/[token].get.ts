import { createError, defineEventHandler, getRouterParam, setResponseHeader } from "h3";

import { findInvite } from "../../../../iff/access";
import { handover } from "../../../../iff/domain";
import { readState } from "../../../../iff/store";

// What a trusted person sees through their link: the confirmed items assigned
// to them and the owner's instructions. Never the original records.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, "cache-control", "no-store");
  setResponseHeader(event, "x-robots-tag", "noindex, nofollow");
  setResponseHeader(event, "referrer-policy", "no-referrer");
  const invite = await findInvite(getRouterParam(event, "token") ?? "");
  if (!invite) throw createError({ statusCode: 404, statusMessage: "This link has expired or was turned off." });
  const items = handover(await readState(invite.owner), invite.recipient);
  return { recipient: invite.recipient, expiresAt: invite.expiresAt, items };
});
