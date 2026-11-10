import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { revokeAllInvites } from "../server/iff/access";
import { deleteWorkspace, ownerKey, readState } from "../server/iff/store";

// The owner's copy of everything Iff holds about them, or its removal.
// Person-only: the agent can't export or erase a workspace.
export default defineAction({
  description: "Export all of the signed-in person's Iff data as JSON, or delete it.",
  schema: z.object({ op: z.enum(["export", "delete"]) }),
  agentTool: false,
  run: async ({ op }) => {
    const owner = ownerKey();
    if (op === "delete") {
      await revokeAllInvites(owner);
      await deleteWorkspace(owner);
      return { deleted: true };
    }
    const state = await readState(owner);
    return {
      filename: `iff-data-${new Date().toISOString().slice(0, 10)}.json`,
      text: JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2),
    };
  },
});
