import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { researchCompany, type CompanyResearch } from "./lib/research-company";
import { validateSession } from "./lib/auth";
import { esc, escUrl, sanitizeSubject } from "./lib/html-escape";

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

  // Validate session
  const session = await validateSession(event, supabase);
  if (!session) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let transcript: Message[], payload: ScopingPayload;
  try {
    ({ transcript, payload } = JSON.parse(event.body ?? "{}") as {
      transcript: Message[];
      payload: ScopingPayload;
    });
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  // Use leadId from validated session, not from client
  const leadId = session.leadId;

  // Generate proposal slug from company name (stored for future Phase 4 use)
  const proposalSlug = `${payload.company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-workiva`;

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

  // Research company (non-blocking — don't fail the whole flow)
  let research: CompanyResearch | null = null;
  try {
    research = await researchCompany(payload.company_name, payload.industry, supabase);
  } catch (err) {
    console.error("Company research error (non-fatal):", err);
  }

  // Escape all user-supplied values for HTML email
  const e = {
    companyName: esc(payload.company_name),
    industry: esc(payload.industry),
    feeRange: esc(payload.fee_range),
    services: payload.services.map((s) => esc(s)),
    servicesJoined: esc(payload.services.join(", ")),
    duration: esc(payload.project_duration),
    complexity: esc(payload.complexity_tier),
    notes: esc(payload.complexity_notes),
    modules: payload.modules.map((m) => esc(m)),
    email: esc(lead?.email ?? "unknown"),
  };

  // Escape research fields
  const r = research ? {
    research: esc(research.company_research ?? ""),
    website: research.website ? escUrl(research.website) : "",
    websiteDisplay: research.website ? esc(research.website) : "",
    city: esc(research.city ?? ""),
    state: esc(research.state ?? ""),
    country: esc(research.country ?? ""),
    employees: research.numberofemployees ? esc(Number(research.numberofemployees).toLocaleString()) : "",
    revenue: research.annualrevenue ? esc(`~$${(Number(research.annualrevenue) / 1_000_000).toFixed(0)}M`) : "",
    founded: esc(research.founded_year ?? ""),
    isPublic: research.is_public === "true",
    linkedin: research.linkedin_company_page ? escUrl(research.linkedin_company_page) : "",
  } : null;

  // Send HV notification email
  await ses.send(
    new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_ADDRESS!,
      Destination: { ToAddresses: process.env.HV_NOTIFICATION_EMAIL!.split(",").map((e) => e.trim()) },
      Message: {
        Subject: {
          Data: sanitizeSubject(`New Workiva scoping: ${payload.company_name} — ${payload.fee_range}`),
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
  <h1>${e.companyName}</h1>
  <p style="color:#686B70; margin: 0 0 ${r?.research ? "12px" : "24px"};">${e.industry}</p>
  ${r?.research ? `
  <div style="background:#F0F7FF; border-radius:8px; padding:16px; margin-bottom:24px; font-size:13px; color:#002A4E; line-height:1.6;">
    <strong style="display:block; margin-bottom:6px; font-size:11px; color:#079FE0; text-transform:uppercase; letter-spacing:0.5px;">Company Research</strong>
    ${r.research}
    <div style="margin-top:12px; padding-top:12px; border-top:1px solid #D1D3D4; font-size:12px; color:#686B70;">
      ${[
        r.website ? `<strong>Website:</strong> <a href="${r.website}" style="color:#079FE0;">${r.websiteDisplay}</a>` : "",
        r.city && r.state ? `<strong>HQ:</strong> ${r.city}, ${r.state}${r.country && r.country !== "United States" ? `, ${r.country}` : ""}` : "",
        r.employees ? `<strong>Employees:</strong> ~${r.employees}` : "",
        r.revenue ? `<strong>Revenue:</strong> ${r.revenue}` : "",
        r.founded ? `<strong>Founded:</strong> ${r.founded}` : "",
        r.isPublic ? `<strong>Public company</strong>` : "",
        r.linkedin ? `<a href="${r.linkedin}" style="color:#079FE0;">LinkedIn</a>` : "",
      ].filter(Boolean).join(" &middot; ")}
    </div>
  </div>` : ""}

  <div class="fee">${e.feeRange}</div>

  <div class="row"><span class="label">Services</span><span class="value">${e.servicesJoined}</span></div>
  <div class="row"><span class="label">Duration</span><span class="value">${e.duration}</span></div>
  <div class="row"><span class="label">Complexity</span><span class="value" style="text-transform: capitalize;">${e.complexity}</span></div>
  <div class="row"><span class="label">Prospect email</span><span class="value">${e.email}</span></div>
  ${e.modules.length > 0 ? `<div class="row"><span class="label">Modules</span><span class="value">${e.modules.join(", ")}</span></div>` : ""}

  <!-- Scoping Summary -->
  <div style="margin-top: 24px; background: #F8F9FA; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <strong style="color:#002A4E; display:block; margin-bottom:12px; font-size: 14px;">Scoping Summary</strong>
    <p style="color:#686B70; font-size:13px; line-height:1.6; margin:0 0 16px;">${e.notes}</p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; font-size:12px;">
      <tr>
        <td style="padding:6px 12px 6px 0; color:#686B70; vertical-align:top; white-space:nowrap;"><strong>Services:</strong></td>
        <td style="padding:6px 0; color:#002A4E;">
          ${e.services.map((s) => `<span style="display:inline-block; background:#079FE0; color:white; border-radius:100px; padding:2px 10px; font-size:11px; font-weight:600; margin:2px 4px 2px 0;">${s}</span>`).join("")}
        </td>
      </tr>
      <tr>
        <td style="padding:6px 12px 6px 0; color:#686B70; vertical-align:top; white-space:nowrap;"><strong>Estimated timeline:</strong></td>
        <td style="padding:6px 0; color:#002A4E;">${e.duration}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px 6px 0; color:#686B70; vertical-align:top; white-space:nowrap;"><strong>Complexity:</strong></td>
        <td style="padding:6px 0; color:#002A4E; text-transform:capitalize;">${e.complexity}</td>
      </tr>
      ${e.modules.length > 0 ? `<tr>
        <td style="padding:6px 12px 6px 0; color:#686B70; vertical-align:top; white-space:nowrap;"><strong>Workiva modules:</strong></td>
        <td style="padding:6px 0; color:#002A4E;">${e.modules.join(", ")}</td>
      </tr>` : ""}
      <tr>
        <td style="padding:6px 12px 6px 0; color:#686B70; vertical-align:top; white-space:nowrap;"><strong>Prospect:</strong></td>
        <td style="padding:6px 0; color:#002A4E;">${e.email}</td>
      </tr>
    </table>
  </div>

  <a href="mailto:${e.email}?subject=Your Workiva implementation estimate from Harbor View Consulting" class="btn">Send Estimate to Prospect →</a>

  <div class="footer">
    This lead came through the Workiva Scoping Agent.<br />
    Send the prospect their estimate within 24 hours.
  </div>
</div>

<!-- Full Chat Transcript -->
<div style="background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 24px auto 0; border: 1px solid #D1D3D4;">
  <div style="display:flex; align-items:center; margin-bottom:20px;">
    <strong style="color:#002A4E; font-size:16px;">Chat Transcript</strong>
    <span style="margin-left:auto; color:#686B70; font-size:12px;">${transcript.length} messages &middot; ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
  </div>
  ${transcript.map((msg) => {
    const isAssistant = msg.role === "assistant";
    const label = isAssistant ? "Harbor View" : "Prospect";
    const labelColor = isAssistant ? "#002A4E" : "#079FE0";
    const bgColor = isAssistant ? "#F8F9FA" : "#F0F7FF";
    const escapedContent = esc(msg.content).replace(/\n/g, "<br>");
    return `<div style="margin-bottom:16px;">
      <div style="font-size:11px; font-weight:700; color:${labelColor}; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.3px;">${label}</div>
      <div style="background:${bgColor}; border-radius:8px; padding:12px 16px; font-size:13px; color:#333333; line-height:1.6;">${escapedContent}</div>
    </div>`;
  }).join("")}
  <div style="text-align:center; color:#686B70; font-size:11px; margin-top:16px; padding-top:16px; border-top:1px solid #D1D3D4;">
    Transcript captured by the Harbor View Workiva Scoping Agent
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
    body: JSON.stringify({ success: true }),
  };
};
