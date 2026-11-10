import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { handover } from "../server/iff/domain";
import { readState } from "../server/iff/store";
import { formatHandover } from "../shared/handover";

export default defineAction({
  description:
    "Export a trusted person’s owner-preview guide as plain text. Includes confirmed assigned instructions only; no raw documents or account access.",
  schema: z.object({
    recipient: z
      .string()
      .min(1)
      .max(100)
      .describe("Exact trusted person label"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ recipient }) => ({
    filename: "iff-handover.txt",
    mimeType: "text/plain;charset=utf-8",
    text: formatHandover(recipient, handover(await readState(), recipient)),
  }),
});
