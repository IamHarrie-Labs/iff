import { defineAction } from "@agent-native/core/action";
import { readAppState } from "@agent-native/core/application-state";
import { z } from "zod";

import { handover } from "../server/iff/domain";
import { readState } from "../server/iff/store";

const SECTION_NAMES: Record<string, string> = { Discoveries: "findings", Sources: "records", Handover: "plan" };

export default defineAction({
  description:
    "What the user is looking at in Iff right now: the section, the open finding with its evidence and any draft, the active filter, or the plan and who it's for.",
  schema: z.object({}),
  http: false,
  readOnly: true,
  run: async () => {
    const navigation = (await readAppState("navigation")) as {
      view?: string;
      section?: string;
      discoveryId?: string;
      recipient?: string;
      filter?: string;
    } | null;
    if (!navigation) return "No screen state yet. The app may not be open.";
    const screen: Record<string, unknown> = { navigation };
    if (navigation.view !== "home") return screen;

    const state = await readState();
    const section = SECTION_NAMES[navigation.section ?? "Discoveries"] ?? "findings";
    const counts = {
      findings: state.items.length,
      needAnswer: state.items.filter((i) => i.status === "suggested").length,
      confirmed: state.items.filter((i) => i.status === "confirmed").length,
      records: state.sources.length,
    };
    const open = navigation.discoveryId ? state.items.find((i) => i.id === navigation.discoveryId) : undefined;
    screen.iff = {
      section,
      counts,
      ...(open
        ? {
            openFinding: {
              ...open,
              evidence: open.evidence.map((e) => ({
                record: state.sources.find((s) => s.id === e.sourceId)?.name ?? "Record",
                date: e.date,
                quote: e.quote,
              })),
            },
          }
        : {}),
      ...(section === "findings"
        ? {
            visible: state.items
              .filter((i) => !navigation.filter || navigation.filter === "all" || i.status === navigation.filter)
              .map((i) => ({ id: i.id, title: i.title, status: i.status, hasDraft: Boolean(i.draft) })),
          }
        : {}),
      ...(section === "records" ? { records: state.sources.map((s) => ({ id: s.id, name: s.name, date: s.date })) } : {}),
      ...(section === "plan"
        ? { plan: { recipient: navigation.recipient ?? "Alex", items: handover(state, navigation.recipient ?? "Alex") } }
        : {}),
    };
    return screen;
  },
});
