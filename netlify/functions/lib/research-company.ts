import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/companies";

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
}

export async function researchCompany(companyName: string, industry: string): Promise<CompanyResearch> {
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
  "description": "2-3 sentence description: what the company does, how long they've been in business, how they make money, and any notable recent events",
  "website": "full website URL (e.g. https://acme.com)"
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
    };
  }

  return JSON.parse(jsonMatch[0]) as CompanyResearch;
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
