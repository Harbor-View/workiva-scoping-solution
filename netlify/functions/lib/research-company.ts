import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/companies";
const HUBSPOT_NOTES_API = "https://api.hubapi.com/crm/v3/objects/notes";
const HUBSPOT_ASSOC_API = "https://api.hubapi.com/crm/v4/objects/notes";

export interface CompanyResearch {
  name: string;
  domain: string;
  industry: string;
  annualrevenue: string;
  numberofemployees: string;
  city: string;
  state: string;
  country: string;
  description: string;
  website: string;
  about_us: string;
  founded_year: string;
  linkedin_company_page: string;
  is_public: string;
  company_research: string;
}

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function researchCompany(companyName: string, industry: string, supabase?: SupabaseClient): Promise<CompanyResearch> {
  // Check cache first
  if (supabase) {
    const key = normalizeKey(companyName);
    const { data: cached } = await supabase
      .from("company_research")
      .select("research")
      .eq("company_key", key)
      .single();

    if (cached?.research) {
      return cached.research as CompanyResearch;
    }
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Research the company "${companyName}" in the ${industry} industry. Provide the following information in JSON format. Use your best knowledge — if you're unsure about a specific data point, provide a reasonable estimate or leave it as an empty string. Do not fabricate specific numbers you're not confident about.

Return ONLY valid JSON with these fields:
{
  "name": "Official company name",
  "domain": "company website domain (e.g. acme.com)",
  "industry": "industry category",
  "annualrevenue": "estimated annual revenue as a number string (e.g. '50000000'), empty if unknown",
  "numberofemployees": "estimated employee count as a number string (e.g. '500'), empty if unknown",
  "city": "headquarters city",
  "state": "headquarters state/province",
  "country": "headquarters country",
  "description": "One sentence mission/goals statement",
  "about_us": "Short about-company blurb (2-3 sentences)",
  "founded_year": "Year company was founded (e.g. '1998'), empty if unknown",
  "linkedin_company_page": "LinkedIn company page URL, empty if unknown",
  "is_public": "true or false — whether the company is publicly traded",
  "website": "full website URL (e.g. https://acme.com)",
  "company_research": "Detailed research paragraph (4-6 sentences): what the company does, how they make money, how long they've been in business, approximate size and revenue, headquarters location, industry position, any notable recent events or developments, and why they might need Workiva services"
}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      name: companyName,
      domain: "",
      industry,
      annualrevenue: "",
      numberofemployees: "",
      city: "",
      state: "",
      country: "",
      description: "",
      website: "",
      about_us: "",
      founded_year: "",
      linkedin_company_page: "",
      is_public: "",
      company_research: "",
    };
  }

  const result = JSON.parse(jsonMatch[0]) as CompanyResearch;

  // Cache the result
  if (supabase) {
    const key = normalizeKey(companyName);
    await supabase
      .from("company_research")
      .upsert({ company_key: key, company_name: companyName, research: result }, { onConflict: "company_key" })
      .then(() => {}); // fire-and-forget
  }

  return result;
}

export async function upsertHubSpotCompany(research: CompanyResearch): Promise<string | null> {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    console.warn("HUBSPOT_TOKEN not set — skipping HubSpot upsert");
    return null;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Search for existing company by name
  const searchRes = await fetch(`${HUBSPOT_API}/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            { propertyName: "name", operator: "EQ", value: research.name },
          ],
        },
      ],
      properties: ["name"],
      limit: 1,
    }),
  });

  const searchData = (await searchRes.json()) as { results: Array<{ id: string }> };

  const properties: Record<string, string> = {
    name: research.name,
    industry: research.industry,
    description: research.description,
    lifecyclestage: "lead",
    type: "PROSPECT",
  };

  // Only set non-empty values
  if (research.domain) properties.domain = research.domain;
  if (research.annualrevenue) properties.annualrevenue = research.annualrevenue;
  if (research.numberofemployees) properties.numberofemployees = research.numberofemployees;
  if (research.city) properties.city = research.city;
  if (research.state) properties.state = research.state;
  if (research.country) properties.country = research.country;
  if (research.website) properties.website = research.website;
  if (research.about_us) properties.about_us = research.about_us;
  if (research.founded_year) properties.founded_year = research.founded_year;
  if (research.linkedin_company_page) properties.linkedin_company_page = research.linkedin_company_page;
  if (research.is_public) properties.is_public = research.is_public;
  if (research.company_research) properties.company_research = research.company_research;

  if (searchData.results?.length > 0) {
    // Update existing
    const companyId = searchData.results[0].id;
    await fetch(`${HUBSPOT_API}/${companyId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ properties }),
    });
    return companyId;
  } else {
    // Create new
    const createRes = await fetch(HUBSPOT_API, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties }),
    });
    const created = (await createRes.json()) as { id: string };
    return created.id;
  }
}

interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
}

export async function createHubSpotTranscriptNote(
  companyId: string,
  transcript: TranscriptMessage[],
  prospectEmail: string,
  companyName: string,
): Promise<string | null> {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) return null;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Build HTML transcript
  const messagesHtml = transcript
    .map((msg) => {
      const label = msg.role === "assistant" ? "Harbor View" : "Prospect";
      const color = msg.role === "assistant" ? "#002A4E" : "#079FE0";
      const escaped = msg.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
      return `<p style="margin:0 0 12px;"><strong style="color:${color};">${label}:</strong><br>${escaped}</p>`;
    })
    .join("");

  const noteBody = `
<h3 style="color:#002A4E; margin:0 0 4px;">Workiva Scoping Chat Transcript</h3>
<p style="color:#686B70; font-size:13px; margin:0 0 16px;">${companyName} &middot; ${prospectEmail} &middot; ${date}</p>
<hr style="border:none; border-top:1px solid #D1D3D4; margin:0 0 16px;">
${messagesHtml}
<hr style="border:none; border-top:1px solid #D1D3D4; margin:16px 0;">
<p style="color:#686B70; font-size:11px;">Captured by the Harbor View Workiva Scoping Agent</p>`;

  // Create the note
  const noteRes = await fetch(HUBSPOT_NOTES_API, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: new Date().toISOString(),
      },
    }),
  });

  const noteData = (await noteRes.json()) as { id: string };
  if (!noteData.id) return null;

  // Associate note with company
  await fetch(`${HUBSPOT_ASSOC_API}/${noteData.id}/associations/companies/${companyId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify([
      { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 190 },
    ]),
  });

  return noteData.id;
}
