import { defineAction } from "@agent-native/core/action";
import { z } from "zod";

import { demo } from "../server/iff/domain";
import { changeState } from "../server/iff/store";
export default defineAction({
  description:
    "Load fictional Maya sample records into an empty Iff workspace; never overwrite existing records.",
  schema: z.object({}),
  run: () => changeState((s) => (s.sources.length ? s : demo())),
});
