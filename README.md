# SentientOne Samples

Minimal, runnable samples that show how to call a [SentientOne](https://www.sentientone.ai) agent from four common stacks: **.NET**, **Next.js**, **Python**, and **React**. Each sample exposes a small UI (or HTTP endpoint) that forwards a user message to the SentientOne `chat/stream` API and pipes the response back.

> Need an account? Sign up for a free 14-day trial at **[www.sentientone.ai](https://www.sentientone.ai)** — no credit card required.

---

## About SentientOne

SentientOne is an agent orchestration platform that lets teams **ship production AI agents in days, not months of engineering**. You build agents in the dashboard — choose a model (GPT-4o, Claude, Gemini, …), wire up a knowledge base, connect tools via MCP — and your application talks to a stable REST endpoint instead of managing prompts, model SDKs, or vector stores.

Capabilities used in these samples:

| Feature | What it gives you |
| --- | --- |
| **Agent Creation** | Custom personas, models, and instructions, isolated per agent |
| **Knowledge Base** | Documents, FAQs, and web pages referenced at request time |
| **MCP Integration** | Agents can call real tools and data sources |
| **REST API** | Authenticated endpoints — send a message, receive a response |
| **Request Tracing** | Per-call visibility into auth, retrieval, tools, latency, tokens, cost |
| **Provider switching** | Swap LLM providers from the dashboard with no code changes |

You keep control of your own LLM API keys (BYOK) and your data flow.

---

## What's in this repo

| Folder | Stack | What it shows |
| --- | --- | --- |
| [`DotNet/`](./DotNet) | ASP.NET Core Minimal API on .NET 10 | `GET /chat?message=...` proxy that streams the agent response |
| [`NextJs/`](./NextJs) | Next.js 15 (App Router) + TypeScript | UI page with a button → server route → agent |
| [`Python/`](./Python) | FastAPI + httpx | UI page served by FastAPI → `/api/chat` proxy → agent |
| [`React/`](./React) | React 19 + Vite | UI page with a button → Vite dev-server proxy → agent |

All four samples follow the same pattern: **the API key never leaves the server**. The browser talks to a small local proxy; the proxy adds the `X-Api-Key` and `X-Agent-Id` headers and forwards to `https://api.sentientone.ai/v1/chat/stream`.

---

## Prerequisites

Before running any sample you need two values from your SentientOne dashboard:

1. **API key** — looks like `sk-so-...`
2. **Agent ID** — UUID of the agent you want the sample to talk to

Create both at [www.sentientone.ai](https://www.sentientone.ai) → Dashboard → Agents.

Each sample reads them from environment variables (or `appsettings.json` for .NET). Copy the provided `.env.example` to `.env.local` (or `.env`) and fill in your values.

---

## Quick start

### 1. .NET (`DotNet/`)

Requirements: [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0).

```bash
cd DotNet
# Edit appsettings.json and set ApiKey and AgentId
dotnet run
```

Then in another terminal:

```bash
curl -N "http://localhost:5080/chat?message=Hello!%20Can%20you%20introduce%20yourself%3F"
```

The endpoint streams the agent's response straight from the upstream API.

### 2. Next.js (`NextJs/`)

Requirements: Node.js 20+.

```bash
cd NextJs
cp .env.example .env.local
# Edit .env.local and fill in SENTIENTONE_API_KEY and SENTIENTONE_AGENT_ID
npm install
npm run dev
```

Open <http://localhost:3000>, type a message, click **Send to agent**.

### 3. Python (`Python/`)

Requirements: Python 3.10+.

```bash
cd Python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and fill in SENTIENTONE_API_KEY and SENTIENTONE_AGENT_ID
python main.py
```

Open <http://localhost:8000>, type a message, click **Send to agent**.

### 4. React (`React/`)

Requirements: Node.js 20+.

```bash
cd React
cp .env.example .env.local
# Edit .env.local and fill in SENTIENTONE_API_KEY and SENTIENTONE_AGENT_ID
npm install
npm run dev
```

Open <http://localhost:5173>, type a message, click **Send to agent**.

> The React sample uses a Vite dev-server middleware to keep the API key out of the browser. For production, deploy the same logic behind a real backend (or use the Next.js sample as a reference).

---

## How a request flows

```
Browser/Client                Local proxy                    SentientOne
─────────────                  ───────────                    ───────────
button click  ─►  POST /api/chat  ─►  POST /v1/chat/stream  ─►  Agent
                  (adds headers)      X-Api-Key, X-Agent-Id
                                      Content-Type: json
                                      { "message": "..." }
                  ◄──────────────  ◄──  text/event-stream  ◄──
display text
```

The wire call each proxy makes is equivalent to:

```bash
curl -X POST "https://api.sentientone.ai/v1/chat/stream" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $SENTIENTONE_API_KEY" \
  -H "X-Agent-Id: $SENTIENTONE_AGENT_ID" \
  -d '{ "message": "Hello! Can you introduce yourself?" }'
```

---

## Adapting the samples

- **Change the agent.** Update `SENTIENTONE_AGENT_ID` (or `AgentId` in `appsettings.json`). No code changes needed.
- **Switch the LLM provider.** Do it from the SentientOne dashboard — the samples don't care.
- **Parse the stream.** The samples display the raw upstream response. If you need structured chunks, parse the SSE `data:` lines on the client and extract the fields you want.
- **Add auth in front of the proxy.** The proxies as-shipped are unauthenticated for clarity — put your own auth layer in front before exposing them publicly.

---

## Security notes

- **Never** commit a real `.env`, `.env.local`, or a populated `appsettings.json`. The repo's `.gitignore` already excludes `.env*` (with `.env.example` allowed) and `appsettings.*.local.json`.
- Treat any API key that has been pushed to a remote — even briefly — as compromised, and rotate it from the SentientOne dashboard.
- BYOK on SentientOne means your LLM provider keys live in SentientOne, not in this repo.

---

## Links

- Website & free trial: <https://www.sentientone.ai>
- API host used by these samples: `https://api.sentientone.ai`
- Issues / feedback: open an issue on this repository.
