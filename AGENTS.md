<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project context

Before large changes, read **`PROJECT_STATUS.md`** — what's shipped, what was fixed recently, and the prioritized build backlog for GrowthDialer.

## Vendor confidentiality

Never expose infrastructure vendors or internal APIs to end users (marketing copy, UI labels, toasts, or API error messages shown in the app). Use generic product language instead — e.g. "voice service", "billing portal", "call analysis". Partner integrations users connect to (HubSpot, Salesforce, Zapier) are fine to name. Internal code, logs, and admin-only routes may reference vendors.

## Cursor Cloud specific instructions

Next.js 16 (App Router, Turbopack) frontend backed by Supabase (auth + Postgres + RLS), with Telnyx (voice), Stripe (billing), Groq/Gemini (AI) and Resend (email) integrations. Dependencies install with `yarn install --ignore-engines` (matches `vercel.json`). Run the dev server with `yarn dev` on `http://localhost:3000`.

**You cannot run the app without Supabase env vars.** `proxy.ts` (middleware) runs on every request and constructs a Supabase client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If those are missing, *every* route — including the marketing homepage — returns HTTP 500. Put env in `.env.local` (gitignored). Minimum to boot + use auth/leads/dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (workspace creation uses the service-role client)
- `APP_URL` / `NEXT_PUBLIC_APP_URL` = `http://localhost:3000`
Telnyx/Stripe/Groq/Gemini/Resend keys are only needed to exercise voice/billing/AI/email; placeholders are fine for everything else. With a placeholder Telnyx key the dashboard logs a harmless `[WebPhone] token fetch failed: 500` (voice token) — non-voice flows are unaffected.

**Backend options:**
1. *Hosted Supabase* (best parity): point the three Supabase vars at a real project.
2. *Local Supabase* (self-contained; needs Docker + the Supabase CLI): run `supabase start`, then read keys/URL from `supabase status` into `.env.local`. The migration history is **split and incomplete** (`supabase_migrations/` has 001–005, `supabase/migrations/` has 006+), so a clean local apply needs these one-off fixes: (a) copy `supabase_migrations/00{1..5}_*.sql` into `supabase/migrations/`; (b) create the `profiles` table before migration 007 (later migrations assume it exists — only `supabase/schema.sql` defines it); (c) drop the legacy `sequences` table before migration 044 (044 recreates it with a different shape); (d) `GRANT` privileges on all `public` tables to `anon, authenticated, service_role` after the last migration (the local CLI doesn't auto-grant like hosted Supabase, otherwise inserts fail with `permission denied for table ...`). Local signup needs no email confirmation, so signup returns a session immediately.

**Lint / build / test:**
- `yarn lint` works but the repo has many *pre-existing* lint errors (~114) unrelated to setup.
- `yarn build` runs ESLint + TS type-checking (not disabled in `next.config.ts`), so it currently fails on those pre-existing errors. Use `yarn dev` for development.
- No automated test suite (no `test` script and no test files).

Smoke test for the core flow: sign up → create a workspace (Starter/Free, no Stripe needed) → open Leads → add a lead.
