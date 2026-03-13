# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workiva Scoping Solution for Harbor View Consulting — an AI-powered chat that qualifies Workiva implementation prospects, generates fee estimates, researches companies, and routes opportunities for human review. Live at https://workivascoping.harborview-consulting.com.

## Commands

- `netlify dev` — Full local dev (Vite + Netlify Functions together). This is the primary dev command.
- `npm run dev` — Start Vite dev server only (frontend; no functions)
- `npm run build` — TypeScript check (`tsc -b`) + Vite production build
- `npm run lint` — ESLint (no config file at project root; uses flat config defaults from `typescript-eslint`)
- `npm run preview` — Preview production build locally
- No test suite is configured.

## Architecture

**Frontend:** React 19 + Vite + Tailwind CSS + TypeScript. SPA with react-router-dom. Import alias `@/*` maps to `./src/*`.

**Routes:** `/` (Landing) → `/verify` (OTP email gate) → `/chat` (AI scoping) → `/confirmation` (meeting scheduling / skip landing). `/admin` is an OTP-secured test console for HVC staff.

**Deployment:** Netlify. Node 20. Functions bundled with esbuild. SPA catch-all redirect (`/* → /index.html`). Config in `netlify.toml`.

**TypeScript:** Split config — `tsconfig.app.json` covers `src/` (frontend), `tsconfig.node.json` covers `vite.config.ts` only. Netlify Functions in `netlify/functions/` are bundled by esbuild at deploy time but not included in either tsconfig `include` — they still get type-checking via `strict: true` in the IDE but are not part of `tsc -b`.

**Backend:** Netlify Functions (serverless, esbuild-bundled) in `netlify/functions/`.

| Function | Purpose |
|---|---|
| `send-otp` | Generate 6-digit OTP (crypto.randomInt), store in Supabase `otp_tokens`, email via Resend. Rate limited: 5/email/hr. |
| `verify-otp` | Validate OTP, issue session token (stored in `session_tokens`), upsert lead. Rate limited: 5 attempts/10min with OTP lockout. |
| `chat` | Proxy to Claude API with system prompt selection (prospect vs seller). Requires Bearer token. Server-side `isWorkivaSeller` detection. |
| `complete-chat` | Save session, research company (cached in `company_research`), email HVC with scoping summary + full transcript. Requires Bearer token. |
| `send-transcript` | Generate branded PDF (PDFKit), send as Resend attachment. Requires Bearer token. |

**Shared libraries** (`netlify/functions/lib/`):
- `auth.ts` — `validateSession()` extracts Bearer token, validates against `session_tokens` table
- `rate-limit.ts` — Supabase-backed sliding-window rate limiting
- `html-escape.ts` — `esc()`, `escUrl()`, `sanitizeSubject()` for email template safety
- `system-prompt.ts` — `SYSTEM_PROMPT` and `WORKIVA_SELLER_SYSTEM_PROMPT` with structured pricing adjustment framework
- `pricing-config.json` — Editable fee ranges, bundle rules, and adjustment dimensions (org size, migration complexity, integrations, resources, timeline, regulatory, scope volume, confidence-based range width)
- `research-company.ts` — Claude-powered company research with Supabase cache

**Key libraries:** `@anthropic-ai/sdk` (Claude), `@supabase/supabase-js`, `resend`, `pdfkit`, `react-markdown` + `remark-gfm`.

## Key Patterns

- **`<SCOPING_COMPLETE>` tag:** Claude emits `<SCOPING_COMPLETE>{JSON}</SCOPING_COMPLETE>` when scoping is done. Chat.tsx parses this to trigger `complete-chat` and strips it from display.
- **Skip flow:** Prospects can skip the scoping chat. Chat.tsx navigates to `/confirmation` with `{ state: { skipped: true } }`. Confirmation.tsx renders a different card prompting them to return to chat, email the team, or book a meeting.
- **Session token auth:** All protected endpoints require `Authorization: Bearer <token>`. Tokens issued by `verify-otp`, stored in Supabase `session_tokens` (2-hour expiry). Frontend stores token in sessionStorage as part of `hv_lead`.
- **Dual experience:** `@workiva.com` emails get `WORKIVA_SELLER_SYSTEM_PROMPT`; all others get `SYSTEM_PROMPT`. Detection server-side from validated session email.
- **Session storage keys:** `hv_lead` (leadId + email + sessionToken), `hv_admin` + `hv_admin_token` (admin auth).
- **Pricing adjustment framework:** `pricing-config.json` contains both the static fee table and structured adjustment rules across 8 dimensions (information confidence, org size, migration state, integrations, internal resources, timeline, regulatory, scope volume). `buildAdjustmentGuidance()` in `system-prompt.ts` renders these into the system prompt so Claude applies percentage adjustments and widens/narrows ranges based on conversation signals. Adjustment caps: +60% max up, -25% max down from tier midpoint.
- **Company research cache:** `company_research` Supabase table keyed by normalized company name. Avoids redundant Claude API calls for previously researched companies.
- **HV notification email:** Comma-separated `HV_NOTIFICATION_EMAIL` env var supports multiple recipients. Email includes company research, scoping summary with service pills, and full chat transcript.
- **Email blocking:** `src/lib/blocked-domains.ts` blocks competitors, free email providers, etc. `workiva.com` is intentionally NOT blocked.
- **Security headers:** `public/_headers` adds CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **Admin console:** OTP-gated (`@harborview-consulting.com`). Onboarding guide, test profiles (prospect/seller/custom), quick-launch, simulate-completion with realistic per-service transcripts.

## Environment Variables

Frontend (VITE_ prefix): none currently required.

Backend (Netlify env / `.env`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLAUDE_API_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`
- `HV_NOTIFICATION_EMAIL` — comma-separated for multiple recipients

## Supabase Tables

`leads`, `otp_tokens`, `chat_sessions`, `session_tokens`, `rate_limits`, `company_research`

## Tailwind Brand Colors

`hv-navy` (#002A4E), `hv-blue` (#079FE0), `hv-slate` (#686B70), `hv-mint` (#3AB795), `hv-coral` (#FF6F61), `hv-yellow` (#FFC857), `hv-white` (#F8F9FA), `hv-border` (#D1D3D4).
