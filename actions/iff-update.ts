import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { changeState } from "../server/iff/store";
export default defineAction({
  description:
    "Update a finding with instructions or a status the user gave you. Only the owner can set status to confirmed, from the app; to propose an answer use iff-draft instead. Never invent ownership, coverage or current balances.",
  schema: z.object({
    id: z.string().describe("Discovery id"),
    status: z
      .enum(["suggested", "confirmed", "inactive"])
      .optional()
      .describe("Lifecycle status. Only the owner can set confirmed, from the app."),
    instructions: z
      .string()
      .max(4000)
      .optional()
      .describe("Instructions supplied by the user"),
    recipient: z
      .string()
      .max(100)
      .optional()
      .describe("Trusted person label for local handover preview"),
    essential: z
      .boolean()
      .optional()
      .describe("Whether someone depends on this item"),
  }),
  // Checks run before anything is written, and a write sets an end state,
  // so the agent can fix its arguments and try again.
  retrySafe: true,
  run: ({ id, ...patch }, ctx) => {
    // Only a person can confirm. The agent may suggest an answer, but an item
    // reaches someone's plan only after the owner says it's true.
    if (patch.status === "confirmed" && ctx?.caller !== "frontend")
      fail("Only the owner can confirm a finding. Ask them to confirm it in Findings.");
    return changeState((s) => {
      const i = s.items.find((i) => i.id === id);
      if (!i) fail("Discovery not found");
      Object.assign(i, patch);
      // The owner has answered, so any agent draft has done its job.
      if (ctx?.caller === "frontend") delete i.draft;
      s.activity.unshift(`Updated ${i.title}`);
      return s;
    });
  },
});
