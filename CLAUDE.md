# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## URLs

- **Scoping app:** https://workivascoping.harborview-consulting.com
- **Proposal system:** https://proposal.harborview-consulting.com

## Purpose

Workiva Scoping Agent — a web app that qualifies Workiva implementation prospects, produces a draft fee range via AI chat, generates a proposal, and routes the opportunity into a human review flow.

**North Star:** A prospect or Workiva seller gets in, answers smart questions, books a call, and receives a personalized estimate before they ever sit down with the HV team.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + Tailwind + TypeScript |
| Auth + DB | Supabase (OTP flow, chat transcripts, leads) |
| AI | Claude API (`claude-sonnet-4-6`) |
| Email | AWS SES (`@aws-sdk/client-ses`) |
| Proposal delivery | GitHub API — commits new TSX + updates `App.tsx` + `proposal-registry.ts` in `Harbor-View/Harbor-View-Consulting-Proposal-System` |
| Meeting booking | HubSpot meeting embed |
| Hosting | Netlify |

## Proposal System (external repo)

The existing proposal system lives at `Harbor-View/Harbor-View-Consulting-Proposal-System`. Each proposal is a hardcoded TSX component. When the scoping agent completes a chat, it makes 3 GitHub API commits to that repo:
1. Add `src/pages/proposals/{{CompanySlug}}WorkivaProposal.tsx`
2. Update `src/data/proposal-registry.ts` — new slug + client config
3. Update `src/App.tsx` — new import + route

Netlify auto-deploys on push → proposal live at `proposal.harborview-consulting.com/{{slug}}`

## User Journey

1. **Landing page** → email input (corporate only, 300+ blocked consumer domains)
2. **OTP** → 6-digit code via AWS SES, 10-min expiry in Supabase
3. **AI chat** → Claude, 8–12 dynamic questions, streaming UI
4. **Chat completion** → Claude emits structured JSON payload, proposal TSX generated and committed to GitHub
5. **Confirmation screen** → 24-hour estimate promise + HubSpot meeting embed
6. **HV notification** → AWS SES email with fee range, prospect info, proposal link, one-click send action
7. **HV sends estimate** → within 24 hours

## Claude Chat JSON Payload

```json
{
  "services": ["Financial Reporting", "ESG"],
  "company_name": "Acme Corp",
  "project_duration": "14-18 weeks",
  "fee_range": "$85,000 - $110,000",
  "modules": [],
  "complexity_notes": "...",
  "templates_to_use": ["financial-reporting", "esg"]
}
```

## Supabase Tables

- `leads` — prospect contact info + status
- `otp_tokens` — email, code, expiry
- `chat_sessions` — session ID, transcript, JSON payload

## Environment Variables Required

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLAUDE_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_SES_FROM_ADDRESS
GITHUB_TOKEN
GITHUB_PROPOSAL_REPO=Harbor-View/Harbor-View-Consulting-Proposal-System
VITE_HUBSPOT_MEETING_URL
HV_NOTIFICATION_EMAIL
```

## What's Excluded from V1

- Voice input
- Cal.com (replaced by HubSpot embed)
- Full registration wall before chat
- Rigid 4-phase questionnaire
- Instant proposal delivery (human review loop instead)

## Development Commands

```bash
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run lint     # eslint
npm run preview  # preview production build locally
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy **Project URL** and **anon public key** into `.env.local`
3. Run the following SQL in the Supabase SQL editor to create the required tables:

```sql
-- OTP tokens (email verification)
create table otp_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Prospect leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company_name text,
  status text default 'pending',  -- pending | reviewed | sent | booked
  created_at timestamptz default now()
);

-- Chat sessions
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  transcript jsonb default '[]',
  payload jsonb,                  -- final JSON output from Claude
  proposal_slug text,             -- e.g. "acme-corp-workiva"
  created_at timestamptz default now()
);
```

4. Enable **Row Level Security** on all tables. For now, add a policy allowing service-role full access (tighten later):
```sql
alter table otp_tokens enable row level security;
alter table leads enable row level security;
alter table chat_sessions enable row level security;
```

5. In Supabase → Authentication → Email, **disable** "Confirm email" (we handle OTP ourselves)

## Build Order

1. Phase 0 — pricing table (markdown) + Workiva TSX proposal template
2. Phase 1 — project scaffold (Vite + Tailwind + Supabase)
3. Phase 2 — auth flow (email validation + OTP via SES)
4. Phase 3 — AI chat UI + Claude streaming integration
5. Phase 4 — GitHub API automation (generate + commit proposal)
6. Phase 5 — HV notification email (SES)
7. Phase 6 — confirmation screen + HubSpot embed
