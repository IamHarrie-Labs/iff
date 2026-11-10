import { createHash } from "node:crypto";

import { defineAction, fail } from "@agent-native/core/action";
import { z } from "zod";

import { changeState } from "../server/iff/store";

const CATEGORIES = ["Home & family", "Money & accounts", "Digital life", "Subscriptions", "Protection"] as const;
const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

// The agent reads records the built-in rules missed and raises a finding. The
// quote must appear in the record word for word, so every finding the agent
// adds points to real evidence.
export default defineAction({
  description:
    "Raise a new finding from an imported record that the built-in rules missed, such as a renewal, a dependant, an account or a subscription. `quote` must be copied exactly from the record (one line or sentence). The finding starts as 'Needs an answer'; only the owner can confirm it.",
  schema: z.object({
    source: z.string().min(1).max(200).describe("Record name or id, as shown by iff-workspace"),
    quote: z.string().trim().min(8).max(600).describe("Exact text copied from the record"),
    title: z.string().trim().min(2).max(80).describe("Short name, e.g. 'Car insurance renewal'"),
    category: z.enum(CATEGORIES),
    question: z.string().trim().min(8).max(300).describe("The one question the owner should answer"),
  }),
  // Checks run before anything is written, and a write sets an end state,
  // so the agent can fix its arguments and try again.
  retrySafe: true,
  run: ({ source, quote, title, category, question }) =>
    changeState((s) => {
      const src = s.sources.find((x) => x.id === source || x.name === source);
      if (!src) fail(`No record named "${source}". Use iff-workspace to list records.`);
      if (!norm(src.text).includes(norm(quote)))
        fail("That quote isn't in the record. Copy the exact words from it.");
      const date = quote.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? src.date;
      const evidence = { sourceId: src.id, quote, date };
      const existing = s.items.find((i) => norm(i.title) === norm(title));
      if (existing) {
        if (!existing.evidence.some((e) => e.sourceId === src.id && norm(e.quote) === norm(quote)))
          existing.evidence.push(evidence);
        s.activity.unshift(`Iff added evidence to ${existing.title}`);
        return s;
      }
      s.items.push({
        id: createHash("sha256").update(`agent:${src.id}:${title}`).digest("hex").slice(0, 16),
        title,
        category,
        status: "suggested",
        evidence: [evidence],
        question,
        instructions: "",
        recipient: "",
        essential: false,
        origin: "agent",
      });
      s.activity.unshift(`Iff found ${title}`);
      return s;
    }),
});
