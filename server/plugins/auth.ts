import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

// Pages anyone can open without signing in. Everything else needs a session.
const PUBLIC_PAGES = ["/welcome", "/privacy", "/terms", "/trust", "/p", "/start"];

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/", ...PUBLIC_PAGES],
  publicPaths: [...PUBLIC_PAGES, "/api/iff/guest", "/api/iff/me", "/api/iff/shared", "/api/iff/passkey"],
  rootAuth: false,
  marketing: false,
});
