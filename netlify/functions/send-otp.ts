import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { BLOCKED_DOMAINS } from "../../src/lib/blocked-domains";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ses = new SESClient({
  region: process.env.SES_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
  },
});

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

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: dbError } = await supabase
    .from("otp_tokens")
    .insert({ email: email.toLowerCase(), code, expires_at });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to create verification code" }) };
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: process.env.AWS_SES_FROM_ADDRESS!,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: "Your Harbor View verification code" },
          Body: {
            Html: {
              Data: `
                <div style="font-family: Lato, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                  <img src="https://www.harborview-consulting.com/logo.png" alt="Harbor View Consulting" style="height: 40px; margin-bottom: 24px;" />
                  <h2 style="color: #002A4E; margin-bottom: 8px;">Your verification code</h2>
                  <p style="color: #686B70; margin-bottom: 24px;">Enter this code to continue your Workiva scoping session.</p>
                  <div style="background: #F8F9FA; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #002A4E;">${code}</span>
                  </div>
                  <p style="color: #686B70; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
                </div>
              `,
            },
          },
        },
      })
    );
  } catch (sesError) {
    console.error("SES send error:", sesError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to send verification email" }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
