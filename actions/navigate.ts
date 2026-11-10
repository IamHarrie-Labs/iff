import { defineAction } from "@agent-native/core/action";
import { writeAppStateForCurrentTab } from "@agent-native/core/application-state";
import { z } from "zod";

const SECTIONS = { findings: "Discoveries", records: "Sources", plan: "Handover" } as const;

export default defineAction({
  description:
    "Move the user's screen. In Iff, pass `section` (findings, records or plan), `discoveryId` to open one finding's detail sheet, and `recipient` to show the plan for that person. Use it to show the user the finding you're talking about.",
  schema: z.object({
    section: z.enum(["findings", "records", "plan"]).optional().describe("Workspace section"),
    discoveryId: z.string().max(64).optional().describe("Finding to open"),
    recipient: z.string().max(100).optional().describe("Trusted person whose plan to show"),
    view: z.string().optional().describe("Other app view name"),
    path: z.string().optional().describe("Other URL path"),
    threadId: z.string().optional().describe("Chat thread ID to open"),
  }),
  http: false,
  run: async ({ section, discoveryId, recipient, view, path, threadId }) => {
    const nav: Record<string, string> = {};
    if (section || discoveryId || recipient) {
      const q = new URLSearchParams();
      q.set("view", SECTIONS[section ?? (recipient ? "plan" : "findings")]);
      if (discoveryId) q.set("item", discoveryId);
      if (recipient) q.set("for", recipient);
      nav.view = "home";
      nav.path = `/home?${q}`;
    } else {
      if (!view && !path) throw new Error("Pass a section, a finding, a recipient, a view or a path.");
      if (view) nav.view = view;
      if (path) nav.path = path;
      if (threadId) nav.threadId = threadId;
    }
    nav._writeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await writeAppStateForCurrentTab("navigate", nav);
    return `Opened ${nav.path ?? nav.view}`;
  },
});
