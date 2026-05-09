import { useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Hello! Can you introduce yourself?");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      if (!res.ok || !res.body) {
        setResponse(`Error ${res.status}: ${await res.text()}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setResponse((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setResponse(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>SentientOne · React Sample</h1>
      <p>Click the button to send the message to your agent.</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
      />
      <button onClick={send} disabled={loading || !message.trim()}>
        {loading ? "Sending..." : "Send to agent"}
      </button>

      <pre>{response || "Response will appear here."}</pre>
    </main>
  );
}
