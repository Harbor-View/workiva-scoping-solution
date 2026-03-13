import type { Handler } from "@netlify/functions";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { BLOCKED_DOMAINS } from "../../src/lib/blocked-domains";
import { checkRateLimit } from "./lib/rate-limit";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email: string;
  try {
    ({ email } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!email || typeof email !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
  }

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || BLOCKED_DOMAINS.has(domain)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Please use a corporate email address" }),
    };
  }

  // Rate limit: max 5 OTP sends per email per hour
  const { allowed } = await checkRateLimit(supabase, `send-otp:${email.toLowerCase()}`, 5, 60);
  if (!allowed) {
    return { statusCode: 429, body: JSON.stringify({ error: "Too many requests. Please try again later." }) };
  }

  // IP-based rate limit: 10 OTP sends per IP per hour
  const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
  if (clientIp !== "unknown") {
    const { allowed: ipAllowed } = await checkRateLimit(supabase, `send-ip:${clientIp}`, 10, 60);
    if (!ipAllowed) {
      return { statusCode: 429, body: JSON.stringify({ error: "Too many requests. Please try again later." }) };
    }
  }

  const code = randomInt(100000, 999999).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: dbError } = await supabase
    .from("otp_tokens")
    .insert({ email: email.toLowerCase(), code, expires_at });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to create verification code" }) };
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_ADDRESS!,
      to: [email],
      subject: "Your Harbor View verification code",
      html: `
        <div style="font-family: Lato, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #002A4E; margin-bottom: 8px;">Your verification code</h2>
          <p style="color: #686B70; margin-bottom: 24px;">Enter this code to continue your Workiva scoping session.</p>
          <div style="background: #F8F9FA; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #002A4E;">${code}</span>
          </div>
          <p style="color: #686B70; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error("Email send error:", emailError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to send verification email" }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
