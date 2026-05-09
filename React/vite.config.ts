import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function sentientOneProxy(env: Record<string, string>): Plugin {
  return {
    name: "sentientone-proxy",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }

        const baseUrl = env.SENTIENTONE_BASE_URL || "https://api.sentientone.ai";
        const apiKey = env.SENTIENTONE_API_KEY;
        const agentId = env.SENTIENTONE_AGENT_ID;
        if (!apiKey || !agentId) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: "Set SENTIENTONE_API_KEY and SENTIENTONE_AGENT_ID in .env.local"
          }));
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const body = Buffer.concat(chunks).toString("utf8");

        const upstream = await fetch(`${baseUrl}/v1/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
            "X-Agent-Id": agentId
          },
          body
        });

        res.statusCode = upstream.status;
        res.setHeader(
          "Content-Type",
          upstream.headers.get("Content-Type") ?? "text/event-stream"
        );
        res.setHeader("Cache-Control", "no-cache");

        if (!upstream.body) {
          res.end();
          return;
        }
        const reader = upstream.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), sentientOneProxy(env)],
    server: { port: 5173 }
  };
});
