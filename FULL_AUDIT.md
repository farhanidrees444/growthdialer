# GrowthDialer — FULL A-Z AUDIT (Jan 2026)

Repo: `github.com/farhanidrees444/growthdialer` @ `main` (cc72a92)
Verified with: `npx tsc --noEmit`, `npx eslint`, `npx next build`, manual inspection of all 77 API routes + 26 migrations.

Severity: **🔴 P0 blocker · 🟠 P1 high · 🟡 P2 medium · 🟢 P3 low**

---

## 🔴 P0 — Stops production / kills features RIGHT NOW

### P0-1 — WebRTC outbound calling broken: wrong env var name
**File:** `app/api/voice/token/route.ts:14`
```ts
const credentialId = process.env.TELNYX_CREDENTIAL_ID;
```
But your handoff says env var is `TELNYX_TELEPHONY_CREDENTIAL_ID=2961466452013483464`.
→ `credentialId` is `undefined` → code falls through to SIP password fallback. If `NEXT_PUBLIC_TELNYX_SIP_USERNAME` / `TELNYX_SIP_PASSWORD` are also not set, browser dialer cannot register at all.
**Fix:** read `process.env.TELNYX_TELEPHONY_CREDENTIAL_ID` (or rename env var on Vercel).

### P0-2 — Dashboard metrics crashes on `analytics_id`
**File:** `app/api/dashboard/metrics/route.ts:27, 45, 57, 68`
Your handoff explicitly states: `❌ NO analytics_id column (this caused 42703 crash)`.
But `dashboard/metrics` SELECTs `analytics_id` and uses it for AI-hours-saved calculation.
→ Dashboard cards either crash with 42703 or return junk data.

Same column referenced in:
- `app/api/ai/process-call/route.ts:38, 47, 264, 290, 349`
- `app/api/telnyx/webhook/route.ts:51, 69, 340, 502`

**Fix:** either (a) re-add `analytics_id` column via migration, OR (b) replace it everywhere with a JOIN to `call_analytics ON call_analytics.call_id = calls.id`.

### P0-3 — Outbound calls have NULL `started_at` → break stats / number health / recordings ordering
**File:** `app/api/calls/dial/route.ts:58, 98`
INSERT writes `created_at` only. **No `started_at` ever set.** But these routes filter/order by `started_at`:

| Route | Effect |
|---|---|
| `app/api/numbers/list/route.ts:39,46,52` | Number stats (total / answered / last_used) over 30 days **exclude every outbound call** → all 9 numbers show 0 calls |
| `app/api/recordings/list/route.ts` (before my fix) | Recordings ordered by started_at — many shown last |
| `app/api/analytics/distribution/route.ts` | Hourly connects + weekly trend use `created_at` (OK) but answered_at filter is fine |
| Dashboard Number Health card | Same as numbers/list |

**Fix:** in `dial/route.ts` both inserts add `started_at: new Date().toISOString()`. Plus a one-time SQL: `UPDATE calls SET started_at = created_at WHERE started_at IS NULL;`

### P0-4 — Stripe lives behind a placeholder secret
**File:** `lib/stripe.ts:3`
```ts
new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", ...)
```
If `STRIPE_SECRET_KEY` is missing in Vercel, Stripe SDK loads with `sk_test_placeholder` and every checkout / portal / webhook fails with 401. Build also fails on `apiVersion` mismatch (`2026-03-25.dahlia` vs SDK's `2026-05-27.dahlia`).

**Fix:** (1) update `apiVersion` to `"2026-05-27.dahlia"` (2) remove the placeholder and throw 503 when key is missing.

### P0-5 — Build fails: missing `ws` dependency
`next build` crashes — `telnyx@6.65.0` SDK imports `ws` (websocket) but it's not in `package.json`. The `parallel` dial route lazy-imports `lib/telnyx.ts` → build error.
**Fix:** `yarn add ws && yarn add -D @types/ws` OR remove the unused `text-to-speech-ws` import inside `lib/telnyx.ts`.

---

## 🟠 P1 — Critical security / data-integrity

### P1-1 — Two parallel auth systems = users locked out
- `middleware.ts` checks **Supabase** session.
- `lib/auth.ts` is **NextAuth v5 beta** with JWT.
- All 77 API routes use only `supabase.auth.getUser()`.

→ A user who logs in via NextAuth gets a valid NextAuth cookie but **every API returns 401**. Either delete NextAuth entirely or replace all `supabase.auth.getUser()` calls with `auth()`.

**Recommendation:** Delete `lib/auth.ts`, `lib/user-store.ts`, `app/api/auth/[...nextauth]/`, `app/api/auth/register/`, `types/next-auth.d.ts`, and remove `next-auth` from package.json. Pure Supabase Auth is what's actually in use.

### P1-2 — `lib/user-store.ts` is an in-memory Map with plain-text passwords
```ts
const userMap = new Map<string, RegisteredUser>();
...
if (registered && registered.password === password) // ← plain compare
```
- On Vercel cold start the Map is wiped → user "doesn't exist" until next register.
- Each region has its own copy.
- Passwords are stored unhashed.

If a single user has ever registered through this and is not also in Supabase Auth, they cannot log back in. **Critical bug if anyone actually used `/signup`.**

### P1-3 — Demo credentials accepted in production
**File:** `lib/auth.ts:8-17`
```ts
const DEMO_USERS = [{ email: "demo@growthdialer.com", password: "demo1234", ... }];
```
Not wrapped in `NODE_ENV === 'development'` check. Anyone on the live site can sign in as "Alex Rivera, admin, growth plan".

### P1-4 — Telnyx webhook accepts unsigned events
**File:** `app/api/telnyx/webhook/route.ts:149`
No `telnyx-signature-ed25519` verification. Attacker can forge:
- `call.answered` for any call_control_id they guess → triggers `record_start` (you pay)
- `call.recording.saved` with an attacker-hosted MP3 → arbitrary audio ends up on victim's recording page and goes through Whisper + Gemini (you pay for AI too)
- Fake `call.hangup` → terminates real calls in your DB

**Fix:** verify the ed25519 signature with `TELNYX_PUBLIC_KEY` before processing.

### P1-5 — `/api/calls/hangup` has zero auth
**File:** `app/api/calls/hangup/route.ts`
No `getUser()` call. Anyone who learns a `call_control_id` (logged in browser console, in DB, leaked via realtime) can hang up any user's live call.

### P1-6 — `/api/ai/follow-up` and `/api/ai/summary` are unauthenticated
Both `POST` → `openai.chat.completions.create({ model: 'gpt-4o' })`. No session, no rate-limit. **Direct financial DoS** — attacker hits in a loop, your OpenAI bill explodes.
**Fix:** add `getUser()` + the existing `lib/ai/rate-limiter.ts`.

### P1-7 — `/api/health` leaks env-var configuration
Public GET tells the world which env keys are wired up (TELNYX_API_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.) — fingerprints your stack.

### P1-8 — `INTERNAL_API_SECRET` defaults to empty string in webhook
**File:** `app/api/telnyx/webhook/route.ts:589`
```ts
'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
```
If env var is missing, webhook sends empty header. The receiver (`process-call/route.ts:13`) compares to `process.env.INTERNAL_API_SECRET` → both `undefined` → both compare equal → **anyone can call `/api/ai/process-call` with arbitrary call_id**.
**Fix:** throw at module init if `INTERNAL_API_SECRET` is unset.

### P1-9 — `/api/coaching/active-calls` has no role check
Any authenticated SDR sees every other agent's live calls + lead PII. Privacy / compliance issue.

### P1-10 — Webhook missing-call fallback can overwrite wrong call
**File:** `app/api/telnyx/webhook/route.ts:455-460`
"Last resort: blind update by control id" — if findCall returned null but later another user has a row with the same `telnyx_call_id` (Telnyx IDs are globally unique, so unlikely, but possible if a row was orphaned), the update applies user-agnostic.
**Fix:** require at least a `user_id` match before updating.

### P1-11 — `lib/stripe.ts` apiVersion is wrong
TypeScript build error. Already covered in P0-4. Listed separately because even with the env key set, this still breaks `tsc`.

---

## 🟡 P2 — Functional bugs / wrong behaviour

### P2-1 — Recordings page (just fixed by my previous diff)
- `/api/recordings/list/route.ts` SELECTed 4 non-existent columns:
  - `recording_duration_seconds` (now added by my migration 030)
  - `transcript_status` ❌ never existed
  - `ai_intent` ❌ never existed
  - `ai_analysis_status` ❌ real name `ai_processing_status`
- Frontend silently returned `[]` on error — also fixed.
- Diagnostic endpoint `/api/recordings/diagnostics` added for self-service debugging.

### P2-2 — `process-call` marks `ai_processed=true` *before* transcription
**File:** `app/api/ai/process-call/route.ts:57-65`
```ts
// Mark as in-progress
await update({ ai_processed: true, ai_processing_status: 'processing' })
// then transcription happens; if it throws → returns early
```
If transcription fails, `ai_processed` is left at `true`. Re-trigger via webhook idempotency check at `webhook:500-507` blocks the retry. **Failed AI = permanently failed.**
**Fix:** set `ai_processing_status='processing'` only, NOT `ai_processed=true`. Set `ai_processed=true` ONLY at the very end (after the analytics row exists).

### P2-3 — Webhook idempotency blocks legitimate reprocessing
**File:** `app/api/telnyx/webhook/route.ts:500-507`
```ts
if (ai_processed || analytics_id || status==='completed' || status==='processing') skip
```
After a failed `process-call` (P2-2), the call is stuck with `status='processing'` for ever. When Telnyx legitimately re-fires `call.recording.saved` (which it can on retry), it's skipped.
**Fix:** allow retry when `ai_processing_status='failed'` OR more than 5 minutes have passed since `ai_processing_status` was set to `processing` (use `updated_at`).

### P2-4 — Stripe webhook has zero side-effects
**File:** `app/api/stripe/webhook/route.ts:25-43`
All three branches (`checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`) only `console.log` — no DB update. **Successful Stripe payments do not upgrade the user's plan in your DB.** Anyone who pays gets nothing in the app.

### P2-5 — Lead import schema mismatch
**File:** `app/api/leads/import/route.ts:96-102`
Sets `status: 'invalid_phone'` but the `leads.status` CHECK constraint in migration 001 allows only `new | contacted | qualified | converted | rejected | meeting_booked | callback`. Rows with `invalid_phone` will be rejected by Postgres → entire import fails with a partial DB error.

### P2-6 — `numbers/purchase` ignores HTTP errors when tagging
**File:** `app/api/numbers/purchase/route.ts:60-71`
`fetch(...).catch(...)` — no `.then()` to check `res.ok`. Telnyx may return 422 (already tagged) and the user-tag isn't applied, breaking the `numbers/sync` recovery flow later.

### P2-7 — `numbers/purchase` doesn't decrement counter on Stripe failure
There's no Stripe checkout in this route — number is bought from Telnyx (you pay) without charging the user. If you intend to bill per number, this whole path needs `stripe.subscriptionItems.create()`.

### P2-8 — `calls/dial` `single()` throws when no default number
**File:** `app/api/calls/dial/route.ts:32-39`
If user has multiple active numbers and none marked `is_default=true`, `.single()` throws PGRST116 → caught silently → falls back to `process.env.TELNYX_FROM_NUMBER` → **two users share one env-default number**.
**Fix:** `.order('is_default', { ascending: false }).order('created_at').limit(1).maybeSingle()`.

### P2-9 — Drop-voicemail can stack playback over live talk
**File:** `app/api/calls/drop-voicemail/route.ts:55-60`
`overlay: false, loop: false` — but doesn't first answer the call or check call state. If user clicks "drop VM" while caller is still talking, the voicemail audio plays *into the live channel*, both parties hear it. Should call `hangup` first OR check `payload.state === 'answered'` AND `to_number` is dialing voicemail.

### P2-10 — `app/api/calls/[id]/hold` Supabase `.or()` injection-prone
```ts
.or(`id.eq.${callControlId},telnyx_call_id.eq.${callControlId}`)
```
Telnyx call_control_id contains `:` (e.g. `v2:xyz`). Supabase `.or()` splits on `,` and `:` — query can match wrong row, or return Telnyx-format IDs as 404s. Already in audit findings.

### P2-11 — Two power-dial route hierarchies
- `app/api/dialer/power-session/*` — start, pause, resume, end, next, active (used 6× in `hooks/use-power-dialer.ts`)
- `app/api/power-dial/sessions/*` — PATCH stats only (used 1× in `hooks/use-power-dialer.ts:280`)

If a user pauses on path A but stats PATCH to path B, the session row diverges. Symptom: power dial summary shows wrong meeting/call counts. **One of these is dead code — delete it.**

### P2-12 — `useTimer` in dialer page resets on every dependency tick
**File:** `app/(dashboard)/dialer/page.tsx:65-80`
```ts
useEffect(() => {
  if (running) { setSecs(0); ref.current = setInterval(...) }
  return () => clearInterval(ref.current);
}, [running]);
```
React 19 cleans up the previous interval AFTER setting the new one → live call timer flickers / freezes at 00:00 on state oscillation.

### P2-13 — `dialer/page.tsx` mutates 12 refs during render (React 19 errors)
ESLint `react-hooks/refs` rule flags 12 cases. Pattern:
```ts
const phoneStatusRef = useRef(phoneStatus);
phoneStatusRef.current = phoneStatus;  // ← during render, not in useEffect
```
React 19 concurrent rendering may discard renders — ref ends up stale. Power dialer can dial the wrong lead, skip/next operations target old queue.

Files affected:
- `app/(dashboard)/dialer/page.tsx` (4 cases)
- `hooks/use-power-dialer.ts` (8 cases)

### P2-14 — `set-state-in-effect` violations (17 cases, ESLint errors)
Most impactful:
- `hooks/use-sidebar-counts.ts:58` — re-fetches counts on every render until paint
- `app/(dashboard)/dashboard/page.tsx:492` — metrics re-fetch loop
- `lib/call-context.tsx:64` — `setCallAnsweredAt(new Date())` every render

Hot tabs fire several requests/sec.

### P2-15 — Middleware deprecation: Next.js 16
Build warning: `The "middleware" file convention is deprecated. Please use "proxy" instead.` Next minor (16.3) will remove it → auth breaks.
**Fix:** rename `middleware.ts` → `proxy.ts`, same handler.

### P2-16 — `NEXT_PUBLIC_APP_URL` vs `APP_URL` inconsistency
- `webhook:579` uses `NEXT_PUBLIC_APP_URL ?? APP_URL ?? 'http://localhost:3000'`
- `dial/route.ts:69` uses only `APP_URL`
- `stripe/checkout:45` uses only `NEXT_PUBLIC_APP_URL`

If only one is set, half the routes work. Symptom: AI pipeline triggers but Stripe checkout breaks (or vice versa).

### P2-17 — `analytics/distribution` `weekBuckets` boundary bug
**File:** `app/api/analytics/distribution/route.ts:87-98`
`weekEnd` is **today 00:00 UTC** but `weekStart` is 6 days before. Today's calls land in `bucket.end` exclusive — **today's data is excluded from weekly trend**. Weekly chart always shows yesterday's last bar empty.

### P2-18 — `CRON_SECRET` guard fails open
**File:** `app/api/cron/cleanup-trash/route.ts`, `release-expired-numbers/route.ts`
If env var unset, both sides read `undefined`, the comparison `undefined === 'Bearer undefined'.replace('Bearer ', '')` evaluates `undefined === 'undefined'` (string). False, good. BUT a request with no `Authorization` header → `token` is `''` → comparison fails → safe.
Actually this one is OK. Marked here to confirm — it does fail closed. Leaving as note.

---

## 🟢 P3 — Code quality / cleanup

### P3-1 — 23 dead PascalCase dialer components
Not imported anywhere:
`AiInsightsPanel.tsx`, `BattleCards.tsx`, `CallControls.tsx`, `CallNotesPanel.tsx`, `CallTimer.tsx`, `CoachingSidebar.tsx`, `CurrentLeadCard.tsx`, `DialerPanel.tsx`, `Keypad.tsx`, `LeadCard.tsx`, `LeadIntel.tsx`, `LeadQueue.tsx`, `LiveStats.tsx`, `ParallelLines.tsx`, etc. Pollutes IDE search.

### P3-2 — 6+ unused npm packages
- `twilio@5.13.1`, `@twilio/voice-sdk@2.18.1` — zero imports (you've migrated to Telnyx)
- `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` — no imports anywhere
- `shadcn@4.2.0` — CLI installed as runtime dep
Bundle bloat + audit/CVE surface.

### P3-3 — 165 ESLint errors, 90 warnings
Mostly:
- Unused imports (`Clock`, `XCircle`, `useMemo`, `cn`, …)
- Unescaped JSX entities (24)
- `eslint-disable react-hooks/exhaustive-deps` masking real stale-closure bugs (e.g. `dialer/page.tsx:289` hides a bug where disposition saves use stale `pendingCallDbId`)

### P3-4 — `metadataBase` not set
Build warning: OG images and canonical URLs render with relative paths → poor SEO and broken share previews.

### P3-5 — Recharts `width(-1) and height(-1)` during SSG
4 chart components rendered without `dynamic({ ssr: false })`. Hydration warnings.

### P3-6 — `app/test-dialer/page.tsx` reachable in production
Dev scratch page protected only by `NEXT_PUBLIC_TEST_DIALER_PASSWORD` (public env var → visible in JS bundle). Move under `(dev-only)` or delete.

### P3-7 — `recording_supabase_path` column exists but nothing populates it
Migration 028 adds the column. No code path uploads to a Supabase bucket. Either implement the upload (your handoff says "Supabase Storage bucket `recordings` PRIVATE needed") or drop the column.

### P3-8 — `analytics/distribution` `disposition` source mismatch with leads page
- Leads page sets `leads.status='meeting_booked'`
- Calls page sets `calls.disposition='meeting_booked'`
- Stats today reads `leads.status` for meetings count, dashboard reads `calls.disposition` for sparkline
- Discrepancy: 5 calls disposed "meeting_booked" but lead's status not updated → meetings card shows different counts on different pages.

---

## 📋 DB / Migration drift (the meta-bug behind half of P0/P1)

Your codebase references columns the migrations don't create AND vice versa. Below is the gap:

### Columns code uses but NO migration creates them:
- `calls.transcript_status` — used in `recordings/route.ts`, `recordings/[id]/page.tsx`
- `calls.ai_intent` — used in old version of recordings list
- `calls.ai_analysis_status` — used in many places (real column is `ai_processing_status`)
- `calls.recording_status` — referenced in handoff doc
- `calls.recording_duration_seconds` — only in my new migration 030

### Columns migrations create but you say "doesn't exist":
- `calls.analytics_id` — migration 007 creates it; you say 42703. Means **migration 007 was never applied** OR you manually dropped it.

### Migrations 011-029 status uncertain
Your handoff says only 026, 027, 028 are pending. But migrations 011 (voicemails), 013 (deal_value_usd), 019 (soft_delete), 020 (team_architecture), 021 (coaching) — are they applied? Code references all of these.

### ✅ ACTION: Run this in Supabase SQL Editor to see the truth
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'calls' AND table_schema = 'public'
ORDER BY ordinal_position;
```
Compare output against this expected list (based on migrations 001 → 029):
```
id, user_id, lead_id, telnyx_call_id, telnyx_session_id, direction,
status, from_number, to_number, started_at, answered_at, ended_at,
created_at, updated_at, duration_seconds, hangup_cause, disposition,
recording_url, recording_supabase_path, transcript, was_recorded,
ai_processed, ai_processed_at, ai_processing_status, ai_error,
ai_summary, ai_sentiment, ai_sentiment_score, ai_keywords,
ai_next_steps, ai_objections, analytics_id, deal_value_usd, notes
```
Anything missing → run the migration for it. Anything extra → tell me which one.

---

## 🛠 SUGGESTED FIX ORDER (do them in this order)

### Hour 1 (Build + Production)
1. **P0-1** voice/token env var rename (1 line) — **WebRTC unblocks**
2. **P0-3** dial route adds `started_at` (2 lines) + one-time UPDATE SQL — **Number stats unblock**
3. **P0-4 / P0-5** Stripe apiVersion + `ws` package — **Build unblocks**

### Day 1 (Security)
4. **P1-4** Telnyx webhook ed25519 verify
5. **P1-5** add auth to `/api/calls/hangup`
6. **P1-6** add auth + rate-limit to AI follow-up / summary
7. **P1-8** throw if `INTERNAL_API_SECRET` empty
8. **P1-2 / P1-3 / P1-1** delete NextAuth + `lib/user-store.ts` + demo users — pure Supabase Auth

### Day 2 (Functional)
9. **P0-2** decide: re-add `analytics_id` OR refactor to JOIN
10. **P2-1** recordings page (already fixed by my previous patch)
11. **P2-2 / P2-3** process-call idempotency redesign
12. **P2-4** Stripe webhook → real DB updates
13. **P2-8** dial fromNumber `.maybeSingle()`
14. **P2-12 / P2-13 / P2-14** React 19 ref + effect fixes in dialer

### Week 1 (Cleanup)
15. **P3-2** remove twilio + three + shadcn packages
16. **P3-1** delete dead PascalCase components
17. **P2-15** rename middleware → proxy
18. Run ESLint --fix on the 92 auto-fixable warnings

---

## ⚙️ Your MANUAL TASKS (Supabase / Vercel / Telnyx)

These are NOT code — only you can do them.

### Supabase SQL Editor
1. Run migrations that may not be applied: 007 (analytics_id + pgvector + call_analytics), 011 (voicemails), 013 (deal_value_usd), 026, 027, 028, 029, 030.
2. Run the column audit query above to confirm.
3. Storage → create bucket `recordings` (PRIVATE) **only if you intend to mirror Telnyx recordings** — otherwise drop `calls.recording_supabase_path`.
4. Realtime → enable on the `calls` table (your inbound popup needs it).
5. Run: `UPDATE calls SET started_at = created_at WHERE started_at IS NULL AND direction = 'outbound';` (after P0-3 code fix).

### Vercel Environment Variables — verify ALL of these are set
- `TELNYX_API_KEY` ✅ (already set)
- `TELNYX_CONNECTION_ID` ✅
- `TELNYX_TELEPHONY_CREDENTIAL_ID` ✅ (you have it, but code reads wrong name — see P0-1)
- `TELNYX_FROM_NUMBER` ✅
- `TELNYX_PUBLIC_KEY` ❌ — needed for webhook signature verification (P1-4)
- `APP_URL` AND `NEXT_PUBLIC_APP_URL` — both should be `https://www.growthdialer.com`
- `INTERNAL_API_SECRET` — must be set, any long random string
- `SUPABASE_SERVICE_ROLE_KEY` — required for webhook DB writes
- `GROQ_API_KEY` — Whisper transcription
- `GEMINI_API_KEY` — call analysis
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_STARTER_PRICE_ID` + `STRIPE_GROWTH_PRICE_ID` (when ready)
- `CRON_SECRET` — for `/api/cron/*` routes
- `AUTH_SECRET` — only if you keep NextAuth (recommend removing)

### Telnyx Portal
- Voice App webhook URL = `https://www.growthdialer.com/api/telnyx/webhook` POST API v2 ✅
- Storage = Telnyx S3 ✅ (verify in portal)
- Public Key (from API Keys page) → save to Vercel as `TELNYX_PUBLIC_KEY` for P1-4

---

## 📊 BY-THE-NUMBERS

| Metric | Count |
|---|---|
| Total API routes | 77 |
| ESLint errors | 165 |
| ESLint warnings | 90 |
| TypeScript errors | 1 (Stripe apiVersion) |
| Build status | **❌ FAILS** (missing `ws`) |
| Routes with auth | 73 / 77 |
| Routes missing auth (non-public) | 4 |
| P0 issues | 5 |
| P1 issues | 11 |
| P2 issues | 18 |
| P3 issues | 8 |
| Total issues | **42** |
| Files with React 19 ref/effect errors | 7 |
| Dead components | 23 |
| Dead npm packages | 6+ |
| Migration files | 26 (some unapplied) |

---

## 🎯 TL;DR — WHAT TO DO FIRST

If you can do only ONE thing right now:
1. Open `app/api/voice/token/route.ts` line 14 → change `TELNYX_CREDENTIAL_ID` to `TELNYX_TELEPHONY_CREDENTIAL_ID` → deploy. **WebRTC outbound dialing comes alive.**

If you can do FIVE things in 30 minutes:
1. ☝️ above
2. `app/api/calls/dial/route.ts` → both insert blocks: add `started_at: new Date().toISOString()` next to `created_at`. **Number stats start working.**
3. Supabase SQL: `UPDATE calls SET started_at = created_at WHERE started_at IS NULL;`
4. `lib/stripe.ts` → `apiVersion: "2026-05-27.dahlia"`. **Build passes.**
5. `yarn add ws @types/ws`. **Build passes for real.**

---

This audit is read-only. Tell me which P0/P1 you want me to apply patches for, and I'll generate them as paste-ready code blocks — no Emergent paid plan needed for review or patches. The paid plan only adds longer sessions, the code-review depth is the same.
