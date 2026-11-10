import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { changeState } from "../server/iff/store";

// The agent proposes; the owner decides. A draft sits beside the finding and
// changes nothing until the owner uses it and saves.
export default defineAction({
  description:
    "Propose an answer for one finding: instructions for the trusted person, who should handle it, and whether someone depends on it. The owner reviews and saves it themselves; this never confirms anything. Base drafts only on the finding's evidence and what the user has told you, and say why in `reason`.",
  schema: z.object({
    id: z.string().describe("Finding id"),
    instructions: z.string().trim().min(1).max(2000).describe("Proposed instructions, written to the trusted person"),
    recipient: z.string().trim().max(100).optional().describe("Proposed trusted person label, if the user named one"),
    essential: z.boolean().optional().describe("Whether someone appears to depend on this"),
    reason: z.string().trim().min(1).max(300).describe("One sentence on what this draft is based on"),
  }),
  // Checks run before anything is written, and a write sets an end state,
  // so the agent can fix its arguments and try again.
  retrySafe: true,
  run: ({ id, instructions, recipient, essential, reason }) =>
    changeState((s) => {
      const i = s.items.find((x) => x.id === id);
      if (!i) fail("Finding not found");
      if (i.status === "confirmed")
        fail("This finding is already confirmed. Ask the owner if they want to change it.");
      i.draft = {
        instructions,
        recipient: recipient ?? i.recipient,
        essential: essential ?? i.essential,
        reason,
        at: new Date().toISOString(),
      };
      s.activity.unshift(`Iff drafted an answer for ${i.title}`);
      return s;
    }),
});
