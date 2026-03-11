import type { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, WORKIVA_SELLER_SYSTEM_PROMPT } from "./lib/system-prompt";

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
  let isWorkivaSeller = false;
  try {
    ({ messages, isWorkivaSeller } = JSON.parse(event.body ?? "{}") as { messages: Message[]; isWorkivaSeller?: boolean });
    isWorkivaSeller = isWorkivaSeller ?? false;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // Claude API requires at least one message with role "user"
  const apiMessages = messages.length === 0
    ? [{
        role: "user" as const,
        content: isWorkivaSeller
          ? "Hi, I'm a Workiva seller and I'd like to submit a scoping request for one of my customers."
          : "Hi, I'd like to get a Workiva implementation estimate.",
      }]
    : messages;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: isWorkivaSeller ? WORKIVA_SELLER_SYSTEM_PROMPT : SYSTEM_PROMPT,
    messages: apiMessages,
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
