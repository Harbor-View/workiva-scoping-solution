import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, WORKIVA_SELLER_SYSTEM_PROMPT } from "./lib/system-prompt";
import { validateSession } from "./lib/auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Validate session
  const session = await validateSession(event, supabase);
  if (!session) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let messages: Message[];
  try {
    ({ messages } = JSON.parse(event.body ?? "{}") as { messages: Message[] });
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // Determine seller status server-side from validated email
  const isWorkivaSeller = session.email.endsWith("@workiva.com");

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
