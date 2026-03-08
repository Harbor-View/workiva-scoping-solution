import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ScopingPayload {
  services: string[];
  company_name: string;
  industry: string;
  project_duration: string;
  fee_range: string;
  complexity_tier: string;
  complexity_notes: string;
  modules: string[];
  templates_to_use: string[];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let leadId: string, transcript: Message[], payload: ScopingPayload;
  try {
    ({ leadId, transcript, payload } = JSON.parse(event.body ?? "{}") as {
      leadId: string;
      transcript: Message[];
      payload: ScopingPayload;
    });
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // Generate proposal slug from company name
  const proposalSlug = `${payload.company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-workiva`;

  const proposalUrl = `https://proposal.harborview-consulting.com/${proposalSlug}`;

  // Fetch lead email
  const { data: lead } = await supabase
    .from("leads")
    .select("email")
    .eq("id", leadId)
    .single();

  // Update lead with company name
  await supabase
    .from("leads")
    .update({ company_name: payload.company_name, status: "pending" })
    .eq("id", leadId);

  // Save chat session
  const { error: sessionError } = await supabase.from("chat_sessions").insert({
    lead_id: leadId,
    transcript,
    payload,
    proposal_slug: proposalSlug,
  });

  if (sessionError) {
    console.error("Session save error:", sessionError);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to save session" }) };
  }

  // Send HV notification email
  await ses.send(
    new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_ADDRESS!,
      Destination: { ToAddresses: [process.env.HV_NOTIFICATION_EMAIL!] },
      Message: {
        Subject: {
          Data: `New Workiva scoping: ${payload.company_name} — ${payload.fee_range}`,
        },
        Body: {
          Html: {
            Data: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Lato, sans-serif; background: #F8F9FA; margin: 0; padding: 32px; }
    .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #D1D3D4; }
    h1 { color: #002A4E; font-size: 22px; margin: 0 0 4px; }
    .badge { display: inline-block; background: #079FE0; color: white; border-radius: 100px; font-size: 12px; font-weight: 700; padding: 3px 10px; margin-bottom: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F0F0F0; }
    .label { color: #686B70; font-size: 13px; }
    .value { color: #002A4E; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
    .fee { font-size: 28px; font-weight: 900; color: #002A4E; text-align: center; padding: 20px; background: #F8F9FA; border-radius: 8px; margin: 24px 0; }
    .notes { background: #F8F9FA; border-radius: 8px; padding: 16px; color: #686B70; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
    .btn { display: block; text-align: center; background: #079FE0; color: white; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin-bottom: 12px; }
    .btn-outline { display: block; text-align: center; background: white; color: #079FE0; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-decoration: none; border: 2px solid #079FE0; margin-bottom: 24px; }
    .footer { color: #686B70; font-size: 12px; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
<div class="card">
  <div class="badge">New Scoping Lead</div>
  <h1>${payload.company_name}</h1>
  <p style="color:#686B70; margin: 0 0 24px;">${payload.industry}</p>

  <div class="fee">${payload.fee_range}</div>

  <div class="row"><span class="label">Services</span><span class="value">${payload.services.join(", ")}</span></div>
  <div class="row"><span class="label">Duration</span><span class="value">${payload.project_duration}</span></div>
  <div class="row"><span class="label">Complexity</span><span class="value" style="text-transform: capitalize;">${payload.complexity_tier}</span></div>
  <div class="row"><span class="label">Prospect email</span><span class="value">${lead?.email ?? "unknown"}</span></div>

  <div class="notes" style="margin-top: 24px;">
    <strong style="color:#002A4E; display:block; margin-bottom:6px;">Rationale</strong>
    ${payload.complexity_notes}
  </div>

  <a href="${proposalUrl}" class="btn">Review &amp; Edit Proposal →</a>
  <a href="mailto:${lead?.email ?? ""}?subject=Your Workiva implementation estimate from Harbor View Consulting" class="btn-outline">Send Estimate to Prospect</a>

  <div class="footer">
    This lead came through the Workiva Scoping Agent.<br />
    Send the prospect their estimate within 24 hours.
  </div>
</div>
</body>
</html>
            `,
          },
        },
      },
    })
  );

  // TODO Phase 4: generate and commit proposal to GitHub

  return {
    statusCode: 200,
    body: JSON.stringify({ proposalSlug }),
  };
};
