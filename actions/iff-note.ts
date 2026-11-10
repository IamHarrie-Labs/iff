import { randomUUID } from "node:crypto";

import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { changeState } from "../server/iff/store";
export default defineAction({
  description:
    "Record information the user supplies directly, with their exact note as evidence. Use for obligations or accounts not found in imported documents.",
  schema: z.object({
    title: z.string().min(1).max(120).describe("User-supplied item title"),
    note: z
      .string()
      .min(1)
      .max(4000)
      .describe("Exact information supplied by the user"),
    category: z
      .enum([
        "Home & family",
        "Money & accounts",
        "Digital life",
        "Subscriptions",
        "Protection",
      ])
      .describe("Best matching category"),
  }),
  run: ({ title, note, category }) =>
    changeState((s) => {
      const id = randomUUID(),
        sourceId = randomUUID(),
        date = new Date().toISOString().slice(0, 10);
      s.sources.push({
        id: sourceId,
        name: `Your note: ${title}`,
        text: note,
        date,
      });
      s.items.push({
        id,
        title,
        category,
        status: "suggested",
        evidence: [{ sourceId, quote: note, date }],
        question: "What should someone you trust do with this information?",
        instructions: "",
        recipient: "",
        essential: false,
        origin: "note",
      });
      s.activity.unshift(`Recorded ${title}`);
      return s;
    }),
});
