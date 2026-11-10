import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { ingest } from "../server/iff/domain";
import { changeState } from "../server/iff/store";
export default defineAction({
  description:
    "Import a small plain-text email, payslip or CSV and discover evidence-backed items. Duplicate imports are ignored.",
  schema: z.object({
    name: z.string().min(1).max(200).describe("Source filename"),
    text: z
      .string()
      .min(1)
      .max(100000)
      .describe("Plain UTF-8 content; no binary or PDF"),
  }),
  run: ({ name, text }) => changeState((s) => ingest(s, name, text)),
});
