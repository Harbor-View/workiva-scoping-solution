import type { Handler } from "@netlify/functions";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "./lib/rate-limit";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email: string, code: string;
  try {
    ({ email, code } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email || !code) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email and code are required" }) };
  }

  const normalizedEmail = email.toLowerCase();

  // Rate limit: max 5 verify attempts per email per 10 minutes
  const { allowed } = await checkRateLimit(supabase, `verify-otp:${normalizedEmail}`, 5, 10);
  if (!allowed) {
    // Invalidate all outstanding OTPs for this email
    await supabase
      .from("otp_tokens")
      .update({ used: true })
      .eq("email", normalizedEmail)
      .eq("used", false);

    return { statusCode: 429, body: JSON.stringify({ error: "Too many attempts. Please request a new code." }) };
  }

  // Find a valid, unused token
  const { data: token, error: fetchError } = await supabase
    .from("otp_tokens")
    .select("id, expires_at, used")
    .eq("email", normalizedEmail)
    .eq("code", code)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid verification code" }) };
  }

  if (new Date(token.expires_at) < new Date()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Verification code has expired" }) };
  }

  // Mark token as used
  await supabase.from("otp_tokens").update({ used: true }).eq("id", token.id);

  // Upsert lead record
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .upsert({ email: normalizedEmail, status: "pending" }, { onConflict: "email" })
    .select("id")
    .single();

  if (leadError || !lead) {
    console.error("Lead upsert error:", leadError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to create session" }) };
  }

  // Generate session token
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  const { error: tokenError } = await supabase.from("session_tokens").insert({
    lead_id: lead.id,
    token: sessionToken,
    email: normalizedEmail,
    expires_at: expiresAt,
  });

  if (tokenError) {
    console.error("Session token error:", tokenError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to create session" }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ leadId: lead.id, email: normalizedEmail, sessionToken }),
  };
};
