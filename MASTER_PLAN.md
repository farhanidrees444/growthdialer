# GrowthDialer — Master Plan (41 Steps + Manual)

> **Owner:** Farhan Idrees  
> **Last audited:** June 8, 2026 (codebase + `.env.local`)  
> **Rule:** A step is ✅ **Done** only when it is **shipped, tested, and beats competitors** on that dimension (UI/UX, backend, SEO, honesty).  
> **How to run:** Reply in Cursor with `go step N` or `go steps 5-7`. This file updates after each step.

---

## Status legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started / not moat-ready |
| 🟡 | Partially built — needs polish or real-world test |
| ✅ | Done — advanced, modern, verified |

---

## Do this FIRST (before Step 1)

**Order:** Manual block → **Step 5** → **Steps 6–7** → then **Steps 1–4** (marketing honesty).

Why: Recordings + AI are your core differentiator vs Nooks/CloudTalk. Marketing fixes matter, but empty Recordings makes every claim false.

---

## Manual checklist (Farhan — not Cursor)

Copy the same vars to **Vercel** (production) as `.env.local` where applicable.

### Already OK in `.env.local` ✅

- `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID`, `TELNYX_FROM_NUMBER`, `TELNYX_TELEPHONY_CREDENTIAL_ID`
- `APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`, `GEMINI_API_KEY`, `INTERNAL_API_SECRET`, `RESEND_API_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

### Missing in `.env.local` — add for full product ⚠️

| Variable | Needed for |
|----------|------------|
| `TELNYX_PUBLIC_KEY` | **Production webhook signature verify** (recordings fail silently without valid webhooks) |
| `NEXT_PUBLIC_APP_URL` | Client URLs + AI pipeline callback (`https://app.growthdialer.com`) |
| `HUBSPOT_CLIENT_ID` + `HUBSPOT_CLIENT_SECRET` | HubSpot OAuth connect |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Billing |
| `STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID` | Workspace checkout ($49 / $99) |
| `CRON_SECRET` | Scheduled jobs (number release, cleanup) |
| `EMAIL_FROM` | Team invite emails (e.g. `GrowthDialer <noreply@growthdialer.com>`) |

### Portal / Supabase (manual)

- [ ] Telnyx balance positive (was negative — blocks all voice)
- [ ] Telnyx webhook → `https://app.growthdialer.com/api/telnyx/webhook` (API v2, include `call.recording.saved`)
- [ ] Run Supabase migrations **037 → 046** in SQL Editor (incl. `046_protect_webhook_secret_column.sql`)
- [x] Storage bucket `call-recordings` (private) — exists in dashboard
- [ ] Run migration **047** for storage RLS policies + index
- [ ] Supabase Realtime on `calls` ✅
- [ ] HubSpot app redirect → `https://app.growthdialer.com/api/integrations/hubspot/callback`
- [ ] Test call **>30s** → open `/api/recordings/diagnostics` while logged in

---

## MOAT register (never lose sight of these)

Features that **beat** PhoneBurner, CallHippo, CloudTalk, Nooks when fully working:

| Moat | Steps | vs competitors |
|------|-------|----------------|
| **AI pipeline** (record → transcribe → summary/sentiment/intent in &lt;4s) | 5–8, 7 | Nooks has intel; you need it **automatic** on every call |
| **Parallel dialer** (10-line + disposition flow) | 32 | Core Nooks parity — polish VM drop + realtime UI |
| **AI Call Brief** pre-dial | 7 (data), 2 (honest claim) | Ahead of dated dialers if brief is fast + accurate |
| **Modern UI** (matte black, command palette, call bar waveform) | 10, 16–18 | Already ahead — finish Call Logs + floating bar |
| **HubSpot live** (zero-entry logging) | 4, 24 | Orum/Nooks strength — you have code, need env |
| **Live coaching** (listen/whisper/barge) | 21 | Manager floor — **whisper/barge** is true moat when audio works |
| **Number health + local presence** | 13, 23 | CloudTalk enterprise feature — you have rotation logic |
| **Honest marketing + SEO compare pages** | 1–3, 33–37 | Trust converts better than fake "0 stats" |
| **Workspace + leaderboard** | 11, 38 | Team floor narrative vs solo tools |

---

## Phase A — Honesty & trust (marketing)

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **1** | Homepage stats show "0" | ✅ | SEO/trust | `CountUp` initializes to final value; animation runs once in-view |
| **2** | Marketing claims audit | ✅ | Trust | `honest-copy.ts` canonical; live/beta/roadmap labels sitewide |
| **3** | Footer & legal honesty | ⬜ | SEO/trust | `/customers` fictional; privacy/terms templates |
| **4** | HubSpot claim consistency | 🟡 | Moat | Code is live; need `HUBSPOT_*` env + UI "Available" badge |

---

## Phase B — Core product (recordings + AI)

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **5** | Recordings diagnostics pass | 🟡 | **Moat** | Enhanced `/api/recordings/diagnostics` — run after test call in prod |
| **6** | Recordings save pipeline | 🟡 | **Moat** | Fixed `ai_processing_status` bug blocking `recording_url` saves |
| **7** | AI pipeline end-to-end | 🟡 | **Moat** | Shared trigger, backfill, cron retry; Gemini 2.5 Flash — verify live call |
| **8** | Supabase recording storage | 🟡 | Ops | Auto-mirror on webhook + signed playback; run migration 047 |

---

## Phase C — UX polish

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **9** | Dashboard Recent Calls empty bug | ⬜ | UX | `ended_at` not set on disposition; query filters it out |
| **10** | Call Logs visual polish | ⬜ | **Moat** | Weakest page vs rest of app |
| **11** | Leaderboard solo state | ⬜ | UX | Empty podium for 1 user |
| **12** | Floating right-edge icons bug | ⬜ | UX | Stacked fixed FABs/overlays |
| **13** | Number Health contradiction | ⬜ | UX | Healthy label vs 0 reputation |
| **14** | Sequences demo cleanup | ⬜ | Demo | Delete junk sequence names |

---

## Phase D — Advanced UX

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **15** | Sidebar polish | 🟡 | UX | ENGAGE/INTELLIGENCE/TEAM/SETUP exists; tune motion/collapse |
| **16** | Floating call bar + waveform | 🟡 | **Moat** | `ActiveCallOverlay` exists; add Web Audio waveform |
| **17** | Command palette expansion | 🟡 | **Moat** | Cmd+K exists; add power dial, disposition, workspace |
| **18** | Page transitions + spotlight | ⬜ | UX | `layoutId` on more routes |
| **19** | Milestones + sound design | 🟡 | Delight | `MilestoneCelebration` exists; wire meeting_booked |

---

## Phase E — Inbound + coaching

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **20** | Inbound calling | 🟡 | Product | Popup + webhook ✅; WebRTC answer needs Telnyx balance test |
| **21** | Live coaching audio | 🟡 | **Moat** | UI ✅; Telnyx conference for whisper/barge = TODO in code |
| **22** | Voicemail drop polish | 🟡 | Product | Library exists; parallel/power reliability |
| **23** | Local presence | 🟡 | **Moat** | `resolve-caller-id.ts` ✅; settings UI + number buying |

---

## Phase F — Monetization & ops

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **24** | Billing live | ⬜ | Revenue | Stripe in repo (not Lemon Squeezy); env missing |
| **25** | Pricing vs product alignment | ⬜ | Trust | Remove/ship AMD, coaching bullets on pricing |
| **26** | PostHog + Clarity | 🟡 | Ops | PostHog keys set; provider **not wired** in layout |
| **27** | Email & notifications | 🟡 | Ops | Resend ✅; missed-call notify, billing emails |
| **28** | Cron jobs | ⬜ | Ops | Needs `CRON_SECRET` |

---

## Phase G — Backend quality

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **29** | Call orchestrator consolidation | 🟡 | Reliability | `CallOrchestratorProvider` started |
| **30** | Data model cleanup | ⬜ | Reliability | Lead status enums, tags, soft-delete |
| **31** | Security remaining | ⬜ | Security | Per-user Telnyx creds, health route lockdown |
| **32** | Parallel dial hardening | 🟡 | **Moat** | VM drop losers, realtime session UI |

---

## Phase H — Marketing depth (SEO)

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **33** | Compare pages quality | 🟡 | SEO | 10 pages exist; need unique tables + honest matrix |
| **34** | Solutions + features depth | 🟡 | SEO | 5 solution slugs; add real screenshots post-Step 7 |
| **35** | Docs + API reference | 🟡 | SEO | Shell exists; webhook/HubSpot/recording guides |
| **36** | Hero product video | ⬜ | SEO | After UI + AI work |
| **37** | Changelog / Roadmap sync | 🟡 | SEO | Pages exist; keep `changelog-data.ts` current |

---

## Phase I — Future moat

| Step | Title | Status | Moat? | Notes |
|------|-------|--------|-------|-------|
| **38** | Team workspaces billing | ⬜ | **Moat** | Seats, metering, manager gates |
| **39** | Salesforce + Zapier live | ⬜ | **Moat** | Second integration beyond HubSpot |
| **40** | AI Voice Agent (receptionist) | ⬜ | **Moat** | Roadmap pillar |
| **41** | Public API + mobile | ⬜ | Enterprise | API docs stub exists |

---

## Already strong (do not break)

These are **working** today — outbound dialer, leads, power/parallel dialer, workspace RLS, dark UI system, sequences builder, Sentry. No step marked ✅ until the 41-step bar is met for that area.

---

## Session log

| Date | Step(s) | Result |
|------|---------|--------|
| 2026-06-08 | Plan created | 41 steps + manual + env audit documented |
| 2026-06-08 | Step 1 | Fixed `CountUp` + `StatsBand` — stats show 50+/3/100%/&lt;4s on first paint; build passes |
| 2026-06-08 | Step 2 | Marketing claims audit — honest-copy.ts, pillars, FAQ, roadmap, pricing; build + push |
| 2026-06-08 | Steps 5–7 | Fixed webhook `ai_analysis_status`→`ai_processing_status`; trigger/backfill/cron; diagnostics |
| 2026-06-08 | Step 8 | Mirror Telnyx recordings → `call-recordings`; signed playback URLs; backfill + cron |

---

## Quick reference — your next message

```
go step 5
```

or after manual Telnyx/migrations:

```
go steps 5-7
```
