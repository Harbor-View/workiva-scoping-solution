# Workiva Scoping Solution

AI-powered scoping tool for [Harbor View Consulting](https://harborview-consulting.com) that qualifies Workiva implementation prospects through a conversational chat experience, generates fee estimates, and routes opportunities for human review.

**Live:** https://workivascoping.harborview-consulting.com

## How It Works

1. **Prospect lands** on the site and enters their corporate email (300+ consumer/competitor domains blocked)
2. **OTP verification** — Cryptographically secure 6-digit code sent via AWS SES, rate limited (5/hr per email)
3. **Session issued** — On OTP success, a session token (2-hour expiry) is issued and used for all subsequent API calls
4. **AI scoping chat** — Claude guides the prospect (or Workiva seller) through 8–12 adaptive questions about reporting needs, team size, timeline, and Workiva modules
5. **Estimate generated** — Claude applies a structured pricing adjustment framework (8 dimensions including org size, migration complexity, integrations, timeline pressure, regulatory overlay) to produce a defensible fee range with confidence-based width
6. **HVC notified** — Email with AI-generated company research, scoping summary, fee range, and the full chat transcript
7. **Transcript PDF** — Branded PDF generated via PDFKit and sent as an SES attachment
8. **Prospect confirmation** — Meeting scheduling via HubSpot embed, contact info for the HVC team. Prospects who skip the chat see a tailored screen prompting them to return or reach out directly

### Workiva Seller Flow

Users with `@workiva.com` emails get a tailored experience focused on deal stage, existing customer footprint, and Salesforce notes. The generated proposal is still addressed to the end customer.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, TypeScript |
| Hosting | Netlify (static site + serverless functions) |
| AI | Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Database | Supabase (PostgreSQL) — `leads`, `otp_tokens`, `chat_sessions`, `session_tokens`, `rate_limits`, `company_research` |
| Email | AWS SES — OTP codes, notifications, PDF transcripts |
| PDF | PDFKit (server-side generation) |
| Security | Session token auth, rate limiting, HTML escaping, CSP headers |
| Tracking | HubSpot (portal 48264605) |

## Local Development

```bash
npm install
netlify dev    # Runs Vite + Netlify Functions together
```

Required environment variables (set in `.env` or Netlify dashboard):

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `CLAUDE_API_KEY`
- `SES_REGION` / `SES_ACCESS_KEY_ID` / `SES_SECRET_ACCESS_KEY` / `AWS_SES_FROM_ADDRESS`
- `HV_NOTIFICATION_EMAIL`

## Project Structure

```
src/
  pages/          Landing, Verify, Chat, Confirmation, Admin, NotFound
  lib/            blocked-domains.ts (email validation)
netlify/
  functions/      Serverless endpoints (chat, complete-chat, send-otp, verify-otp, send-transcript)
  functions/lib/  auth.ts, rate-limit.ts, html-escape.ts, system-prompt.ts, research-company.ts, pricing-config.json
public/           Static assets (team headshots, icons), _headers (security headers)
```

## Security

- **Session tokens** — All protected endpoints require `Authorization: Bearer <token>`, issued on OTP verification (2-hour expiry)
- **Rate limiting** — Supabase-backed sliding window: 5 OTP sends/email/hr, 5 verify attempts/email/10min with automatic OTP lockout
- **Secure OTP** — `crypto.randomInt` (not `Math.random`)
- **HTML escaping** — All user-supplied values escaped in email templates to prevent injection
- **Security headers** — CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy

## Admin Console

Available at `/admin`. Restricted to `@harborview-consulting.com` emails via OTP.

- **Onboarding guide** — Step-by-step instructions for new admin users
- **Test profiles** — Prospect, Workiva Seller, or custom email to test different experiences
- **Quick-launch** — Jump directly into Chat, Confirmation, Landing, or Verify pages
- **Seller preview** — See the Workiva seller-specific chat and confirmation experience
- **Simulate completion** — Fire `complete-chat` with realistic per-service transcripts to test notification emails, company research, and Supabase writes without going through the full chat
