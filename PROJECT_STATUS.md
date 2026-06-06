# GrowthDialer — Project Status & Roadmap

> **Last updated:** June 6, 2026  
> **Continue development in:** Cursor (this repo)  
> **GitHub:** https://github.com/farhanidrees444/growthdialer  
> **Deploy:** Vercel (connected to `main`)  
> **Claude chat reference:** https://claude.ai/share/bd6dee97-2b26-41d5-9391-d9e9f1b17683 *(bot-protected; summary synthesized from repo + sessions)*

---

## What GrowthDialer Is

AI-powered sales dialer SaaS for outbound teams. Core loop: **import leads → dial (manual or power) → disposition → analytics/recordings**. Built for solo reps and small teams with workspace/team scaffolding for scale.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase (auth + Postgres + RLS) · Telnyx (WebRTC voice) · Stripe (billing) · Groq/Gemini (AI) · Vercel

---

## ✅ What Is Built (Shipped)

### Auth & infra
- [x] Supabase email auth (login, signup, OAuth callback)
- [x] Middleware session refresh + protected dashboard routes
- [x] Sentry error tracking
- [x] Marketing site (homepage, pricing, blog, compare pages)
- [x] Deployed on Vercel via GitHub `main`

### Dashboard & navigation
- [x] Dashboard (today's stats, command center)
- [x] Sidebar + mobile bottom nav + top header
- [x] Workspace switcher (multi-workspace UI)
- [x] User menu, role badges

### Leads (canonical entity — table is `leads`, not `contacts`)
- [x] Leads list with filters, tabs, grid/table views
- [x] Lead detail page + activity timeline
- [x] CSV import (`ImportLeadsDialog` → `/api/leads/import`)
- [x] Bulk actions (tags, status, delete, export)
- [x] Soft delete + trash restore
- [x] Lead search dialog (real leads only — mock CRM removed)

### Dialer (main product)
- [x] Telnyx WebRTC calling (browser audio)
- [x] Manual dial + queue-based dialing
- [x] Power dialer (countdown, auto-advance, session summary)
- [x] Live call stage (mute, hold, DTMF, voicemail drop)
- [x] Disposition modal (8 outcomes + callback/meeting scheduling)
- [x] AI brief panel + live insights (Groq/Gemini)
- [x] Keyboard shortcuts
- [x] Double-call bug fixed (single WebRTC call + DB registration)
- [x] Purchased numbers as caller ID

### Calls & recordings
- [x] Call logs in DB (`calls` table)
- [x] Telnyx webhooks (call state, recording)
- [x] Recordings list + detail with AI analysis
- [x] Call notes (auto-save during live call)
- [x] Disposition → lead status update + activity log

### Numbers
- [x] Search, purchase, sync purchased numbers (Telnyx)
- [x] Spam check, default number selection

### Team & workspaces
- [x] DB schema: `workspaces`, `workspace_members`, `workspace_invitations`
- [x] Workspace setup page (plan picker UI)
- [x] Team page + Settings → Team tab
- [x] Invite flow + accept-invite page + Resend emails
- [x] Role system (`owner > admin > manager > agent > viewer`)
- [x] `lib/auth/permissions.ts` granular permissions
- [x] Coaching live page (manager-only nav link)

### Analytics & billing
- [x] Analytics dashboard (KPIs, charts, date range)
- [x] Stripe checkout + portal + webhook (plan columns on user)
- [x] Voicemails library (upload, drop on live call)

### Integrations (UI only)
- [x] Integrations page — **waitlist only** (all `comingSoon: true`)

### Placeholders (routable but not real products yet)
- [x] `/sequences` — links to leads, no sequence builder
- [x] Ask AI / Help / Notifications header buttons — no handlers

---

## 🔧 What Was Fixed Recently (Cursor session — commit `579c21d`)

Pushed to `main` on GitHub; Vercel auto-deploys.

| Area | Fix |
|------|-----|
| **Security** | Call-control, parallel dial, hangup, voicemail-drop — auth + ownership checks |
| **Security** | Telnyx webhook fails closed in production without `TELNYX_PUBLIC_KEY` |
| **Security** | Integration waitlist RLS tightened (migration `036`) |
| **Security** | Auth callback redirects to login on exchange failure |
| **Dialer** | Hold → hangup now runs disposition teardown |
| **Dialer** | `pendingCallDbId` kept for long calls until disposition saves |
| **Dialer** | Disposition save checks HTTP errors before advancing power dial |
| **Dialer** | Power dial modal dismiss → saves voicemail + advances |
| **Dialer** | Timer accumulates across hold; no double-dial during power countdown |
| **Dialer** | Block overlapping outbound calls |
| **Dialer** | Live notes use cookie auth (same as disposition API) |
| **Data** | Disposition only increments `call_attempts` once |
| **UX** | Removed mock CRM contacts from lead search |
| **Routes** | Middleware protects `/numbers`, `/coaching`, `/workspace` |

**Post-deploy actions:** Run in Supabase SQL Editor: `036_fix_integration_waitlist_rls.sql`, `037_workspace_leads_rls.sql`, `038_workspace_calls_rls.sql`

---

## 🚧 What Still Needs to Be Built (Priority Backlog)

### P0 — Product blockers / revenue
1. ~~**Workspace onboarding gate**~~ — ✅ Done (Jun 6): `WorkspaceGate` redirects to `/workspace/setup`; setup page uses minimal chrome
2. ~~**Workspace-scoped leads**~~ — ✅ Done (Jun 6): All `/api/leads/*`, dialer queue, power session routes use `workspace_id`; RLS migration `037`
3. ~~**Workspace-scoped calls**~~ — ✅ Done (Jun 6): All `/api/calls/*`, stats, recordings, dashboard metrics; migration `038`; `lib/auth/call-access.ts`
4. **Align marketing with product** — Pricing ($25–$69/user vs in-app $0/$49/$99), "live today" claims vs placeholders (sequences, integrations)
5. **Run pending Supabase migrations** — Run `037` + `038` in Supabase SQL Editor; consolidate `supabase/migrations/` vs `supabase_migrations/`

### P1 — Dialer & call quality
5. **Call orchestrator** — Single state machine instead of 4 layers (webphone + dialer mode + power dialer + page effects)
6. **Power queue = UI queue** — Power session should use same filters as queue column (`hasPhone`, timezone, soft-delete)
7. **Power session resume** — localStorage restores session ID but not current lead/countdown
8. **Global disposition for off-page calls** — Calls from leads page / overlay skip disposition modal
9. **Inbound vs outbound call isolation** — Inbound ringing shouldn't hijack active outbound session
10. **Parallel dial API** — Align with per-user caller ID or disable until product-ready

### P1 — Security & ops (remaining from audit)
11. **Remove legacy NextAuth demo auth** — `lib/auth.ts`, `demo@growthdialer.com` if still reachable
12. **Protect public health endpoints** — `/api/system/health`, `/api/telnyx/health`
13. **Voice token** — Per-user Telnyx credentials; never return shared SIP password to browser
14. **Workspace role PATCH validation** — Block arbitrary `owner` promotion via API
15. **Stripe checkout** — Require auth before creating session

### P2 — Data model cleanup
16. **Single lead status enum** — Zod schema shared by API + UI (currently 4 incompatible enums)
17. **One tag system** — Pick `leads.tags` array OR `lead_tags` tables; remove the other
18. **Consistent soft-delete** — All read paths filter `deleted_at IS NULL`
19. **Single create path for leads** — `save-as-lead-modal` should use `POST /api/leads`
20. **Generated Supabase types** — `database.types.ts` from CLI

### P2 — UX polish
21. **Mobile nav parity** — Bottom bar missing Analytics, Numbers, Integrations, Coaching
22. **Bottom safe-area padding** — Content hidden under mobile tab bar
23. **Wire or hide dead header buttons** — Ask AI, Help, Notifications
24. **Route-level `loading.tsx` / `error.tsx`** — Branded skeletons + retry
25. **Replace README** — Still default create-next-app boilerplate
26. **Empty state CTAs** — Leads page, settings team tab when no workspace

### P3 — Features (marketing promises / future)
27. **Sequences builder** — Multi-step outreach cadences (currently placeholder)
28. **CRM integrations** — HubSpot, Salesforce, etc. (currently waitlist only)
29. **Real team workspaces in pricing** — Marketing still marks as "soon"
30. **AI coaching enhancements** — Live floor, manager whisper, etc.
31. **Light mode** — `.dashboard-light` tokens exist but unused

---

## 📁 Key Files (start here in Cursor)

| Area | Path |
|------|------|
| Dialer page | `app/(dashboard)/dialer/page.tsx` |
| WebRTC voice | `contexts/webphone-context.tsx` |
| Power dialer | `hooks/use-power-dialer.ts` |
| Leads API | `app/api/leads/*` |
| Calls API | `app/api/calls/*`, `app/api/telnyx/*` |
| Workspaces | `contexts/workspace-context.tsx`, `app/api/workspaces/*` |
| Permissions | `lib/auth/permissions.ts` |
| Migrations | `supabase/migrations/` (canonical) |
| Middleware | `middleware.ts` |

---

## 🔑 Required Env Vars (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELNYX_API_KEY
TELNYX_CONNECTION_ID
TELNYX_PUBLIC_KEY          # required in production for webhooks
TELNYX_TELEPHONY_CREDENTIAL_ID (or SIP creds)
APP_URL                      # e.g. https://app.growthdialer.com
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY               # team invites
INTERNAL_API_SECRET          # AI pipeline
GROQ_API_KEY / GEMINI_API_KEY
CRON_SECRET
```

See `.env.example` and `DEPLOY_INSTRUCTIONS.md` for full list.

---

## 📋 Session Log (what Claude / Cursor did)

| When | Who | What |
|------|-----|------|
| Early | Claude (chat) | Built core SaaS: Telnyx dialer, power dial, leads, recordings, analytics, workspaces, marketing site, Stripe |
| Early | Claude (chat) | Fixed double-call bug, recordings page, Stripe webhooks, Telnyx webhook signatures, security hardening (see `DEPLOY_INSTRUCTIONS.md`, `AI_DIALER_FINAL.md`) |
| Jun 6 | Cursor | Full codebase audit: security, dialer logic, data model, UX gaps |
| Jun 6 | Cursor | Fixed 15 files: API auth, dialer reliability, RLS migration → pushed `579c21d` to GitHub |
| Jun 6 | Cursor | Workspace onboarding gate + workspace-scoped leads APIs + RLS `037` + `apiFetch` client helper |

---

## ▶️ How to Continue in Cursor

1. Read this file first (`PROJECT_STATUS.md`)
2. Pick from **P0 backlog** above
3. Run app: `npm run dev` (ensure Node/npm in PATH)
4. After DB changes: add migration under `supabase/migrations/` and run in Supabase dashboard
5. Test dialer end-to-end after any call-related change
6. Commit to `main` → Vercel auto-deploys

**Suggested next task:** Workspace onboarding gate + thread `workspace_id` through leads APIs (unblocks real team usage).
