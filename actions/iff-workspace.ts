import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { readState } from "../server/iff/store";
export default defineAction({
  description:
    "Read Iff discoveries, source evidence, questions and handover instructions.",
  schema: z.object({}),
  http: { method: "GET" },
  readOnly: true,
  run: () => readState(),
});
