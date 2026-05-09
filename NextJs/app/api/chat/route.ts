import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { message } = (await req.json()) as { message?: string };

  if (!message || !message.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const baseUrl = process.env.SENTIENTONE_BASE_URL ?? "https://api.sentientone.ai";
  const apiKey = process.env.SENTIENTONE_API_KEY;
  const agentId = process.env.SENTIENTONE_AGENT_ID;

  if (!apiKey || !agentId) {
    return new Response(
      JSON.stringify({ error: "Set SENTIENTONE_API_KEY and SENTIENTONE_AGENT_ID in .env.local" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const upstream = await fetch(`${baseUrl}/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      "X-Agent-Id": agentId
    },
    body: JSON.stringify({ message })
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache"
    }
  });
}
