# Workiva Scoping Solution

AI-powered scoping tool for [Harbor View Consulting](https://harborview-consulting.com) that qualifies Workiva implementation prospects through a conversational chat experience, generates fee estimates, and routes opportunities for human review.

**Live:** https://workivascoping.harborview-consulting.com

## How It Works

1. **Prospect lands** on the site and enters their corporate email
2. **OTP verification** — 6-digit code sent via AWS SES, validated against Supabase
3. **AI scoping chat** — Claude guides the prospect (or Workiva seller) through 8–12 questions about their reporting needs, team size, timeline, and Workiva modules
4. **Estimate generated** — Claude emits a structured JSON payload with services, fee range, complexity tier, and recommended modules
5. **HVC notified** — Email with company research, fee summary, proposal credentials, and chat transcript PDF
6. **Prospect confirmation** — Meeting scheduling via HubSpot embed, contact info for the HVC team

### Workiva Seller Flow

Users with `@workiva.com` emails get a tailored experience focused on deal stage, existing customer footprint, and Salesforce notes. The generated proposal is still addressed to the end customer.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, TypeScript |
| Hosting | Netlify (static site + serverless functions) |
| AI | Claude API (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Database | Supabase (PostgreSQL) — `leads`, `otp_tokens`, `chat_sessions` |
| Email | AWS SES — OTP codes, notifications, PDF transcripts |
| PDF | PDFKit (server-side generation) |
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
  functions/lib/  system-prompt.ts, research-company.ts
public/           Static assets (team headshots, icons)
```

## Admin Console

Available at `/admin`. Restricted to `@harborview-consulting.com` emails via OTP. Provides quick-launch buttons to test different user flows with configurable test profiles.
