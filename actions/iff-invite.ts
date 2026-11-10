import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { createInvite, listInvites, revokeInvite } from "../server/iff/access";
import { ownerKey } from "../server/iff/store";

// Sharing a plan is a person's decision, so the agent can't create or revoke links.
export default defineAction({
  description: "Create, list or revoke private links that let a trusted person read their plan.",
  schema: z.object({
    op: z.enum(["list", "create", "revoke"]),
    recipient: z.string().trim().min(1).max(100).optional(),
    id: z.string().max(64).optional(),
  }),
  agentTool: false,
  run: async ({ op, recipient, id }) => {
    const owner = ownerKey();
    if (op === "create") {
      if (!recipient) fail("Name the person this link is for.");
      return { created: await createInvite(owner, recipient), invites: await listInvites(owner) };
    }
    if (op === "revoke") {
      if (!id) fail("Choose a link to turn off.");
      await revokeInvite(owner, id);
    }
    return { invites: await listInvites(owner) };
  },
});
