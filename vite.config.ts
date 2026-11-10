import { agentNative } from "@agent-native/core/vite";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

const reactRouterPlugins = reactRouter as unknown as () => any[];
const agentNativePlugins = agentNative as unknown as (
  options?: Parameters<typeof agentNative>[0],
) => any[];
export default defineConfig({
  optimizeDeps: {
    holdUntilCrawlEnd: false,
    include: ["react-is", "style-to-js"],
    entries: [
      "app/entry.client.tsx",
      "app/root.tsx",
      "app/components/layout/{Layout,Sidebar}.tsx",
      "app/components/chat/ChatRouteContent.tsx",
      "app/routes/{home,chat.$threadId}.tsx",
    ],
  },
  plugins: [
    {
      name: "iff-native-server-dependencies",
      enforce: "pre",
      resolveId(source) {
        if (this.environment.name === "client") return;
        // These published packages already contain Node-compatible ESM. Avoid
        // re-transforming their circular module graphs in Nitro's dev runner.
        if (/^(react-router|crossws)(\/|$)/.test(source)) {
          return { id: source, external: true };
        }
      },
    },
    ...reactRouterPlugins(),
    ...agentNativePlugins({ ssrStubs: ["shiki"] }),
  ],
});
