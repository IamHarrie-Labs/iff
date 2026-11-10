import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { handover } from "../server/iff/domain";
import { readState } from "../server/iff/store";
export default defineAction({
  description:
    "Preview a trusted person’s guide. Returns confirmed assigned items and instructions only, never original source text. This is not an authenticated recipient session.",
  schema: z.object({
    recipient: z
      .string()
      .min(1)
      .max(100)
      .describe("Exact trusted person label"),
  }),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ recipient }) => handover(await readState(), recipient),
});
