# GrowthDialer Audit Report

## Date: 2026-05-23

---

## 🔴 CRITICAL ISSUES (must fix immediately)

### C1 — Unauthenticated AI endpoints burn your API credits
**Files:** `app/api/ai/follow-up/route.ts`, `app/api/ai/summary/route.ts`  
**Issue:** Both POST endpoints have zero auth. Any anonymous request triggers OpenAI gpt-4o API calls. An attacker (or misconfigured client) can make infinite requests with no user check. Combined with no rate limiting, this is an active financial risk.  
**Fix:** Add `supabase.auth.getSession()` guard — same pattern used by 20 other routes in this project.

### C2 — Unauthenticated hangup endpoint
**File:** `app/api/calls/hangup/route.ts`  
**Issue:** `POST /api/calls/hangup` accepts a `call_control_id` and immediately hangs up the call. No session check. Anyone who knows or guesses a `call_control_id` (format: `v2:<uuid>`) can terminate active calls. The call_control_id is also logged in browser console and DB.  
**Fix:** Add auth guard. Verify the user owns the call via `telnyx_call_id` lookup before hanging up.

### C3 — Telnyx webhook has no signature verification
**File:** `app/api/telnyx/webhook/route.ts`  
**Issue:** The webhook accepts any POST with no cryptographic verification that it came from Telnyx. A spoofed POST can fake call events (e.g., fake "call.answered", fake "recording.saved"), write garbage to your DB, and trigger internal API calls.  
**Fix:** Telnyx provides a `telnyx-signature-ed25519` header. Verify it using `crypto.verify` or the official Telnyx webhook verification docs.

### C4 — `/api/health` exposes internal config status with no auth
**File:** `app/api/health/route.ts`  
**Issue:** GET with no auth returns which secret env vars are set (`supabase_service_role_key: true/false`). Tells an attacker exactly which credentials are active and what attack surface exists.  
**Fix:** Either delete this route, add auth, or replace with a pure liveness check (`{ ok: true }`).

### C5 — Dead Twilio packages still installed
**File:** `package.json`  
**Issue:** `twilio@5.13.1` and `@twilio/voice-sdk@2.18.1` are installed. The source files that used them (`lib/twilio.ts`, `hooks/useTwilioDevice.ts`) were deleted, but the packages remain. These add ~8MB to the bundle, create audit surface, and will pull in CVEs on every `npm audit`.  
**Fix:** `npm uninstall twilio @twilio/voice-sdk`

---

## 🟠 HIGH PRIORITY (fix this week)

### H1 — 23 dead PascalCase components in `components/dialer/`
These files are NOT imported by any page or feature component. They are the old v1 dialer UI, fully superseded by the kebab-case components.

```
AiInsightsPanel.tsx    AudioVisualizer.tsx   BattleCards.tsx
CallControls.tsx       CallNotesPanel.tsx    CallTimer.tsx
CoachingSidebar.tsx    CurrentLeadCard.tsx   DialModeSegmented.tsx
DialerPanel.tsx        DispositionPanel.tsx  Keypad.tsx
LeadCard.tsx           LeadIntel.tsx         LeadQueue.tsx
LiveStats.tsx          ManualDialCollapsible.tsx ManualDialer.tsx
MicPermissionModal.tsx ParallelLines.tsx     PhoneStatusBar.tsx
TimezonePill.tsx       UpNextQueue.tsx
```

They cross-import each other (e.g., `DialerPanel` → `ManualDialer` → `Keypad`) but nothing external imports any of them. They also define a duplicate `LeadRecord` type that conflicts with `lib/dialer/state-machine.ts`.  
**Fix:** Delete all 23 files.

### H2 — Three.js (~1.3MB) installed but never imported
**Packages:** `three@0.183.2`, `@react-three/fiber@9.5.0`, `@react-three/drei@10.7.7`, `@types/three@0.183.1`  
**Issue:** Zero imports of `three` or `@react-three/*` anywhere in `app/` or `components/`. Adds >1.3MB to the dependency tree, increases cold-start time, and contributes to bundle size.  
**Fix:** `npm uninstall three @react-three/fiber @react-three/drei @types/three`

### H3 — `next-auth@5.0.0-beta.30` in production
**File:** `package.json`  
**Issue:** Beta auth library on a production SaaS. The `^` version range means a future `npm install` could silently upgrade to a breaking beta. Auth failures = locked-out users.  
**Fix:** Pin to `5.0.0-beta.30` (remove `^`) or migrate to stable `next-auth@4.x` or Supabase-native auth (already used for all other auth flows).

### H4 — ESLint errors in `dialer/page.tsx`
**File:** `app/(dashboard)/dialer/page.tsx`

| Line | Error | Impact |
|------|-------|--------|
| 69 | `setSecs(0)` called synchronously inside `useEffect` — triggers cascading re-render (react-hooks/set-state-in-effect) | Power dialer countdown may reset incorrectly |
| 112 | `activeCallDbId` destructured from `useDialerMode()` but never used | Dead variable, leftover from pre-fix code |
| 161 | `setQueueLeads` imported but never called | Dead state setter |

**Fix for L69:** Move `setSecs(0)` into a conditional or into the transition handler — not bare in the effect body.

### H5 — ESLint errors in other pages

| File | Line | Error |
|------|------|-------|
| `app/(dashboard)/leads/page.tsx` | 380 | `Date.now()` called during render (react-hooks/purity) |
| `app/(dashboard)/recordings/[id]/page.tsx` | 129 | `setPlaying(true)` called in useEffect body |
| `app/(auth)/login/page.tsx` | — | Unescaped apostrophes (react/no-unescaped-entities) |
| `app/(auth)/register/page.tsx` | — | Unescaped apostrophes |
| `app/(dashboard)/settings/page.tsx` | — | Unescaped apostrophes |
| `app/(dashboard)/coaching/live/page.tsx` | — | Unescaped entities |
| `app/(dashboard)/recordings/[id]/page.tsx` | — | Unescaped entities |

### H6 — Stripe is broken: placeholder key, not in `.env.local`
**File:** `lib/stripe.ts:3`  
```typescript
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
```
`STRIPE_SECRET_KEY` is absent from `.env.local`. The fallback `"sk_test_placeholder"` silently initializes Stripe but every API call returns 401. The checkout, portal, and webhook routes are non-functional.

### H7 — AUTH_FUSIONAUTH_* vars referenced in code but not configured
**Issue:** `AUTH_FUSIONAUTH_CLIENT_ID`, `AUTH_FUSIONAUTH_CLIENT_SECRET`, `AUTH_FUSIONAUTH_ISSUER`, `AUTH_FUSIONAUTH_TENANT_ID` are referenced with `!` (required) assertions. If FusionAuth auth path is reached, the app throws at startup. These are only in `.env.example` as placeholders.

---

## 🟡 MEDIUM PRIORITY (fix soon)

### M1 — Queue filter button has no handler
**File:** `components/dialer/queue-column.tsx`  
A filter button exists in the dialer queue UI with no `onClick` handler — purely decorative. Users get no feedback when clicking it.

### M2 — `lib/call-context.tsx` is a thin duplicate of webphone-context
**File:** `lib/call-context.tsx`  
Re-exposes `callStatus`, `isMuted`, `isOnHold`, `activeCallId` from `useWebPhone()`. Only used by `components/active-call-overlay.tsx`. No value over importing `useWebPhone` directly. Adds confusion.

### M3 — AI features silently return mock data when `OPENAI_API_KEY` not set
**Files:** `app/api/ai/follow-up/route.ts`, `app/api/ai/summary/route.ts`  
`OPENAI_API_KEY` is absent from `.env.local`. Both routes check `if (!process.env.OPENAI_API_KEY)` and return hardcoded canned responses. The features appear to work but return fake data. The mock strings hardcode "GrowthDialer" (white-label risk).

### M4 — Duplicate power-dialer session route paths
**Files:** `app/api/power-dial/sessions/` vs `app/api/dialer/power-session/`  
Two separate route hierarchies for power dialer sessions exist. `use-power-dialer.ts` uses `/api/dialer/power-session/*`. The `app/api/power-dial/` tree may be dead.  
**Action:** Grep calls to `/api/power-dial/sessions` — if nothing calls it, delete it.

### M5 — `middleware.ts` deprecation warning
**File:** `middleware.ts`  
Build warns: `The "middleware" file convention is deprecated. Please use "proxy" instead.` (Next.js 16 breaking change).  
**Fix:** Rename `middleware.ts` → `proxy.ts` and verify route matching still works.

### M6 — `metadataBase` not set
Build warns: `metadataBase property in metadata export is not set`. Affects og:image and canonical URL generation.  
**Fix:** Add `metadataBase: new URL(process.env.APP_URL ?? 'https://growthdialer.ai')` to root `layout.tsx` metadata.

### M7 — Coaching routes accessible to any authenticated user (no role check)
**Files:** `app/api/coaching/active-calls/route.ts` and related  
Routes check for a session but do NOT verify the user is a manager/admin. Any authenticated user can see all other users' active calls via `/api/coaching/active-calls`.

---

## 🟢 LOW PRIORITY (nice to have)

### L1 — `CRON_SECRET` guard vulnerable if var is unset
**Files:** `app/api/cron/cleanup-trash/route.ts`, `app/api/cron/release-expired-numbers/route.ts`  
If `CRON_SECRET` is unset, `process.env.CRON_SECRET` is `undefined`, so the check passes for any request with header `Bearer undefined`.  
**Fix:** Add `if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'Not configured' }, { status: 500 })` before the auth check.

### L2 — `app/api/telnyx/health` exposes internal reachability without auth
Returns Telnyx and Groq API reachability + latency. Not secret but unnecessary public exposure of infrastructure topology.

### L3 — Recharts SSG dimension warnings
4 chart components log `width(-1) and height(-1)` during static generation.  
**Fix:** Wrap with `dynamic(() => import('...'), { ssr: false })` for chart components.

### L4 — `TELNYX_CREDENTIAL_ID` in `.env.local` but not referenced in any code
Orphaned env var. Clean it up or document why it's there.

### L5 — `session-replay-map.tsx` renders placeholder data
Imported by `header-strip.tsx`, renders a visual element that appears to contain no real session replay data.

---

## ✅ WORKING WELL

- **Build:** Passes with zero TypeScript errors across 85 routes and pages
- **Call flow (post-fix):** Single WebRTC call per dial — double-call bug resolved
- **`/api/calls/dial` WebRTC branch:** Returns `db_id` (Postgres UUID); `pendingCallDbId` correctly stores it
- **Phone normalization:** `normalizePhone()` called before every dial in both client and server paths
- **Cron routes:** Protected with `CRON_SECRET` Bearer token
- **Webhook DB writes:** Use `createServiceClient()` (service role) — bypasses RLS correctly
- **Power dialer state machine:** `use-power-dialer.ts` is well-structured, countdown/auto-call logic clean
- **Supabase auth pattern:** Consistent `getSession()` + `userId` guard across ~38 routes
- **White-label compliance:** No vendor names (Telnyx/Supabase/Twilio/Stripe) visible in UI
- **RLS:** `user_id` scoping on all anon-client Supabase queries
- **Recording download:** `/api/recordings` returns `recording_url` with lead join, works correctly
- **Lead import (CSV):** Pipeline functional end-to-end
- **Dashboard stats:** Real data from `/api/stats/today`
- **Analytics charts:** Render from real Supabase data

---

## 📊 STATS

| Metric | Count |
|--------|-------|
| Total API routes | 58 |
| Routes with auth guard | ~38 (~65%) |
| Routes missing auth (non-public) | 4 (hangup, ai/follow-up, ai/summary, health) |
| Dead PascalCase dialer components | 23 |
| Dead npm packages (code deleted) | 2 (`twilio`, `@twilio/voice-sdk`) |
| Unused npm packages (never imported) | 4 (`three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`) |
| ESLint errors | 8+ |
| ESLint warnings | 6+ |
| Build warnings | 4 types |
| Missing env vars (in code, not in `.env.local`) | 6+ (`STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `AUTH_FUSIONAUTH_*`, `NEXTAUTH_SECRET`) |
| `dialer/page.tsx` line count | 907 |

---

## 🛠 RECOMMENDED FIX ORDER

1. **Immediately** — Add auth guards to `hangup`, `ai/follow-up`, `ai/summary` (C1, C2)
2. **Immediately** — Add Telnyx webhook signature verification (C3)
3. **Today** — Delete or auth-gate `/api/health` (C4)
4. **Today** — `npm uninstall twilio @twilio/voice-sdk` (C5)
5. **This week** — Delete 23 dead PascalCase dialer components (H1)
6. **This week** — `npm uninstall three @react-three/fiber @react-three/drei @types/three` (H2)
7. **This week** — Fix 3 ESLint errors in `dialer/page.tsx` — `setSecs`, `activeCallDbId`, `setQueueLeads` (H4)
8. **This week** — Add `STRIPE_SECRET_KEY` to `.env.local` or disable Stripe routes (H6)
9. **Soon** — Rename `middleware.ts` → `proxy.ts` (M5)
10. **Soon** — Wire queue filter button or remove it (M1)
11. **Before launch** — Pin `next-auth` version or replace with stable auth (H3)
12. **Before launch** — Add role check to coaching routes (M7)

---

## 📋 DB SQL TO RUN IN SUPABASE SQL EDITOR

```sql
-- Verify calls table has required columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calls'
ORDER BY ordinal_position;

-- Check activities table exists (migration 003)
SELECT COUNT(*) FROM activities LIMIT 1;

-- Verify lead status distribution matches expected values
SELECT DISTINCT status, COUNT(*)
FROM leads
GROUP BY status
ORDER BY count DESC;

-- Find orphaned call records (call with lead_id but no matching lead)
SELECT c.id, c.to_number, c.created_at
FROM calls c
LEFT JOIN leads l ON c.lead_id = l.id
WHERE c.lead_id IS NOT NULL AND l.id IS NULL
LIMIT 20;

-- Find leads stuck in 'queued' (may indicate dialer crash mid-session)
SELECT id, name, phone, updated_at
FROM leads
WHERE status = 'queued'
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 🔎 FEATURE-BY-FEATURE STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| Manual dialing | ✅ Working | Single WebRTC call; DB registration via useEffect |
| Power dialer | ⚠ Untested | State machine looks correct; needs a real call test |
| AI brief panel | ⚠ Mock data | Returns hardcoded response when OPENAI_API_KEY not set |
| AI follow-up suggestions | ⚠ Mock + no auth | Serves canned data; unauthenticated route |
| Call notes | ✅ Working | Uses `pendingCallDbId` (Postgres UUID) correctly |
| Call disposition | ✅ Working | Updates lead status + creates activity record |
| Voicemail drop | ✅ Working | Uses `activeCallId` (Telnyx call_control_id) correctly |
| Call recording toggle | ⚠ Unverified | API route exists; Telnyx recording confirmation needed |
| Recordings page | ✅ Working | Queries `calls WHERE recording_url IS NOT NULL` |
| Dashboard stats | ✅ Working | Real data from `/api/stats/today` |
| Leads page | ✅ Working | Full Supabase query, status filters, search, detail panel |
| Lead import (CSV) | ✅ Working | End-to-end functional |
| Analytics page | ✅ Working | Charts render from real Supabase data |
| Phone number purchase | ❌ Broken | Requires `STRIPE_SECRET_KEY` — currently placeholder |
| Coaching | ⚠ No role auth | Any authenticated user can see all agents' active calls |
| Sequences | ❌ Removed | No route or page found in codebase |
| Stripe billing | ❌ Broken | `sk_test_placeholder` key; `STRIPE_SECRET_KEY` missing from `.env.local` |
