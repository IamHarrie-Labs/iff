import { getSession } from "@agent-native/core/server";
import { defineEventHandler, getRequestURL, sendRedirect, setResponseStatus } from "h3";

import { isAdmin, isBuilderPath, takeMessage } from "../iff/access";

// Runs after the auth guard. Keeps builder screens away from the public and
// puts a daily cap on messages sent to the shared model account.
export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event);
  const isChatSend = event.method === "POST" && pathname === "/_agent-native/agent-chat";
  const isBuilderPage = event.method === "GET" && isBuilderPath(pathname);
  if (!isChatSend && !isBuilderPage) return;

  const session = await getSession(event).catch(() => null);
  const email = session?.email;
  if (!email) return; // the auth guard has already answered signed-out requests

  if (isBuilderPage) {
    if (!isAdmin(email)) return sendRedirect(event, "/home", 302);
    return;
  }

  const usage = await takeMessage(email);
  if (!usage.ok) {
    setResponseStatus(event, 429);
    return {
      error: `You've used today's ${usage.limit} questions. Your workspace still works, and the agent is available again tomorrow.`,
    };
  }
});
