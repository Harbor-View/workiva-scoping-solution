# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workiva Scoping Solution for Harbor View Consulting — an AI-powered chat that qualifies Workiva implementation prospects, generates fee estimates, researches companies, and routes opportunities for human review. Live at https://workivascoping.harborview-consulting.com.

## Commands

- `npm run dev` — Start Vite dev server (frontend only; functions need `netlify dev`)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `netlify dev` — Full local dev with Netlify Functions

## Architecture

**Frontend:** React 19 + Vite + Tailwind CSS + TypeScript. SPA with react-router-dom.

**Routes:** `/` (Landing) → `/verify` (OTP email gate) → `/chat` (AI scoping) → `/confirmation` (meeting scheduling). `/admin` is an OTP-secured test console for HVC staff.

**Backend:** Netlify Functions (serverless, esbuild-bundled) in `netlify/functions/`.

| Function | Purpose |
|---|---|
| `send-otp` | Generate 6-digit OTP, store in Supabase `otp_tokens`, email via SES |
| `verify-otp` | Validate OTP, create lead in Supabase `leads` |
| `chat` | Proxy to Claude API with system prompt selection (prospect vs seller) |
| `complete-chat` | Save session, research company via Claude, generate proposal slug/password, email HVC |
| `send-transcript` | Generate branded PDF (PDFKit), send as SES attachment |

**Key libraries:** `@anthropic-ai/sdk` (Claude), `@supabase/supabase-js`, `@aws-sdk/client-ses`, `pdfkit`, `react-markdown` + `remark-gfm`.

## Key Patterns

- **`<SCOPING_COMPLETE>` tag:** Claude emits `<SCOPING_COMPLETE>{JSON}</SCOPING_COMPLETE>` when scoping is done. Chat.tsx parses this to trigger `complete-chat` and strips it from display.
- **Dual experience:** `@workiva.com` emails get `WORKIVA_SELLER_SYSTEM_PROMPT`; all others get `SYSTEM_PROMPT`. Detection via email domain in both frontend and backend.
- **Session storage:** `hv_lead` (leadId + email), `hv_admin` (admin auth flag), `hv_proposal_slug`.
- **Proposal conventions:** Slug = `{company-name}-workiva`, password = `{companyname}2026`, URL = `https://proposals.harborview-consulting.com/{slug}`.
- **Email blocking:** `src/lib/blocked-domains.ts` blocks competitors, free email providers, etc. `workiva.com` is intentionally NOT blocked.
- **Admin access:** OTP-gated, restricted to `@harborview-consulting.com` domain.

## Environment Variables

Frontend (VITE_ prefix): none currently required.

Backend (Netlify env / `.env`):
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `CLAUDE_API_KEY`
- `SES_REGION`, `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`, `AWS_SES_FROM_ADDRESS`
- `HV_NOTIFICATION_EMAIL`

## Tailwind Brand Colors

`hv-navy` (#002A4E), `hv-blue` (#079FE0), `hv-slate` (#686B70), `hv-mint` (#3AB795), `hv-coral` (#FF6F61), `hv-yellow` (#FFC857), `hv-white` (#F8F9FA), `hv-border` (#D1D3D4).
