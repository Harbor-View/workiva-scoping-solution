import { stream } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./lib/system-prompt";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default stream(async (event) => {
  if (event.httpMethod !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let messages: Message[];
  try {
    ({ messages } = JSON.parse(event.body ?? "{}") as { messages: Message[] });
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  const claudeStream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
});
