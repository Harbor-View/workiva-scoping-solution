import type { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./lib/system-prompt";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let messages: Message[];
  try {
    ({ messages } = JSON.parse(event.body ?? "{}") as { messages: Message[] });
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: text,
  };
};
