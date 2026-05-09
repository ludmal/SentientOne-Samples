import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

BASE_URL = os.getenv("SENTIENTONE_BASE_URL", "https://api.sentientone.ai")
API_KEY = os.getenv("SENTIENTONE_API_KEY")
AGENT_ID = os.getenv("SENTIENTONE_AGENT_ID")

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="SentientOne · Python Sample")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/chat")
async def chat(req: ChatRequest) -> StreamingResponse:
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="message is required")
    if not API_KEY or not AGENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Set SENTIENTONE_API_KEY and SENTIENTONE_AGENT_ID in .env",
        )

    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Agent-Id": AGENT_ID,
    }

    async def stream():
        async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
            async with client.stream(
                "POST",
                f"{BASE_URL}/v1/chat/stream",
                headers=headers,
                json={"message": req.message},
            ) as upstream:
                async for chunk in upstream.aiter_bytes():
                    yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
