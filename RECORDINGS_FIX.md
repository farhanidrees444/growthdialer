# Recordings — Fix Applied & Setup Checklist

## What was broken

**Root cause:** `/api/recordings/list/route.ts` was SELECTing four columns that **do not exist** in any migration:

| Column queried | Status |
|---|---|
| `recording_duration_seconds` | ❌ never created |
| `transcript_status` | ❌ never created |
| `ai_intent` | ❌ never created |
| `ai_analysis_status` | ❌ wrong name (real column: `ai_processing_status`) |

When Supabase hits an unknown column in `.select(...)`, it returns an error. The route then returned `{ recordings: [] }`, and the page rendered the "empty library" state — **regardless of whether recordings were actually saved in the DB**. The frontend also silently swallowed the error (`if (data.error) { return; }`), so you saw no toast / no console explanation.

## What I changed

### 1. `app/api/recordings/list/route.ts` (REWRITE)
- Removed all 4 non-existent columns.
- Added `was_recorded`, `analytics_id`, `ai_sentiment_score`, `ai_error`, `created_at` (real columns).
- Lead join now also returns `name`, `first_name`, `last_name`, `phone` and falls back to `name` → `first_name`/`last_name` split when older leads only have the legacy `name` field.
- Added a secondary `order by created_at desc` so calls with `started_at = null` (DB lookup-failure path) still surface.

### 2. `app/(dashboard)/recordings/page.tsx`
- Errors from `/api/recordings/list` now show a red banner + toast instead of silently rendering empty.
- Added a **Retry** button.

### 3. `app/api/telnyx/webhook/route.ts`
- The 30-second skip now sets `ai_processing_status='skipped_short'` so you can see those calls in the DB rather than them looking "stuck in processing".
- When Telnyx sends `payload.recording_duration_millis`, we persist it to a new `recording_duration_seconds` column. This is the **actual audio length** (used for display) and is independent of the call's talk-time `duration_seconds`.
- Added safety log around the duration computation.

### 4. `supabase/migrations/030_recording_duration.sql` (NEW)
- Adds `recording_duration_seconds INTEGER` column.
- Adds partial index `idx_calls_user_recording` for the recordings page query.

### 5. `app/api/recordings/diagnostics/route.ts` (NEW)
- A new authenticated GET endpoint that returns a structured health check of the recording pipeline. Open `https://YOUR-DOMAIN/api/recordings/diagnostics` from your logged-in browser to instantly see what's wrong.

---

## YOU need to do these MANUAL steps

### Step 1 — Run the new migration in Supabase
1. Go to Supabase Dashboard → SQL Editor.
2. Paste & run the contents of `supabase/migrations/030_recording_duration.sql`.
3. Confirm with:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name='calls' AND column_name='recording_duration_seconds';
   ```

### Step 2 — Confirm Telnyx webhook URL is set correctly
This is the **#1 reason recordings don't save** in deployments.

1. Telnyx Portal → **Voice → Programmable Voice → Applications** → open your app.
2. **Webhook URL** must be exactly:
   ```
   https://YOUR-DEPLOYED-DOMAIN/api/telnyx/webhook
   ```
3. **Webhook URL Method:** `POST`.
4. **Failover URL:** leave blank or set the same URL.
5. **Webhook API version:** `API v2`.
6. Click **Save**.

> ⚠️ If your domain is `localhost` or a `*.vercel.app` preview URL, Telnyx **cannot reach it**. Use your production domain or a tunnel (ngrok) for local testing.

### Step 3 — Confirm Recording is enabled on the Telnyx Voice App
1. Same Telnyx Voice Application screen.
2. Find **"Voice Settings"** section.
3. **Recording:** the project uses `record_start` (programmatic) so this can stay **off** (Telnyx will record only when our webhook tells it to). If you want a belt-and-braces setup, you can enable "Record All Calls" → MP3 → Dual channel. The webhook handles both flows.
4. **Recording Storage:** either "Telnyx Storage" (recommended) or your own S3. The webhook reads both `payload.public_recording_urls` (Telnyx S3) and `payload.recording_urls` (private storage with auth).

### Step 4 — Required environment variables
Confirm these are set in your production env (`Vercel → Project → Settings → Environment Variables`):

| Var | Required for | Notes |
|---|---|---|
| `TELNYX_API_KEY` | Starting recording, downloading audio | Get from Telnyx Portal → API Keys |
| `TELNYX_CONNECTION_ID` | Outbound dial | Telnyx Voice App ID |
| `TELNYX_PUBLIC_KEY` | Webhook signature (future) | Optional today, recommended |
| `APP_URL` | Webhook → AI pipeline trigger | e.g. `https://growthdialer.ai` |
| `NEXT_PUBLIC_APP_URL` | Same fallback | |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook DB writes | From Supabase → Settings → API |
| `INTERNAL_API_SECRET` | Webhook → `/api/ai/process-call` auth | Any long random string |
| `GROQ_API_KEY` | Whisper transcription | https://console.groq.com |
| `GEMINI_API_KEY` | Call analysis (sentiment, summary) | https://aistudio.google.com/apikey |

### Step 5 — Check user settings
1. Log into your app → **Settings → Calling → Recording**.
2. **Recording mode:** must be `always` (or `manual` with the in-call toggle on) — **not** `never`.
3. **Auto-delete short calls:** the default skips recordings <30s. Leave on for normal use.

### Step 6 — Run the diagnostic endpoint
After deploying these changes:
1. Sign in.
2. Open `https://YOUR-DOMAIN/api/recordings/diagnostics`.
3. You'll see something like:
   ```json
   {
     "ok": true,
     "summary": {
       "total_calls": 12,
       "calls_with_recording_url": 8,
       "calls_marked_was_recorded": 8,
       "calls_over_30s": 9
     },
     "env": { "TELNYX_API_KEY": true, ... },
     "issues": [],
     "next_step": "Pipeline looks healthy..."
   }
   ```
4. If `issues` is non-empty, follow each issue's instruction.

### Step 7 — Make a test call
1. From your dialer, call a real phone you can answer.
2. Talk for **at least 35 seconds** (anything under 30s is auto-discarded by design).
3. Hang up.
4. Wait ~30–90 seconds for `call.recording.saved` → AI pipeline to complete.
5. Refresh `/recordings` — your call should appear.

### Step 8 — If recordings still don't appear
Open your hosting platform's logs (Vercel → Logs) and filter for these prefixes — they trace every step:

| Log prefix | What it means |
|---|---|
| `[WEBHOOK] call.initiated` | Telnyx connected, call started |
| `[WEBHOOK] call.answered` | Other party picked up |
| `[REC-A] record_start accepted` | We told Telnyx to start recording ✅ |
| `[REC-A] record_start failed` | Telnyx refused. Check API key + connection ID. |
| `[REC-B] recording.saved fired` | Telnyx finished recording ✅ |
| `[REC-B] NO recording URL in payload` | Telnyx storage misconfigured. Re-check Step 3. |
| `[REC-B] Call too short` | Call was <30s, by design |
| `[REC-C] recording_url saved to DB` | DB write succeeded ✅ |
| `[REC-D] Triggering AI pipeline` | Webhook is firing the AI fetch |
| `[AI-1] Process started` | `/api/ai/process-call` got the request |
| `[AI-3] Whisper complete` | Transcription worked |
| `[AI-5] Saved analytics row` | Full success |

If you only see `[REC-A]` and never `[REC-B]`, Telnyx is recording but **not posting the saved event back**. That points to webhook config (Step 2) or storage config (Step 3).

---

## What I did NOT change (and why)

- **Telnyx webhook signature verification** — out of scope for this fix and would block any test calls. Tracked in `CODE_REVIEW_FINDINGS.md` § P1-3.
- **Stripe `apiVersion` build error** — unrelated to recordings, separate ticket.
- **`/api/ai/process-call` logic** — it already has the right flow. Only blocker is missing API keys, which Step 4 + Step 6 surface.
- **`recording_supabase_path` flow** — your codebase has the column but no code path that uploads recordings to your own Supabase bucket. Today recordings are served directly from Telnyx's URL, which is correct.

---

## TL;DR for the user

1. **Code fixes:** applied — `git diff` to see them.
2. **Migration:** run `030_recording_duration.sql` in Supabase SQL Editor.
3. **Telnyx Voice App:** webhook URL = `https://YOUR-DOMAIN/api/telnyx/webhook`, method POST, API v2.
4. **Env vars:** `TELNYX_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_API_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY` set in production.
5. **Settings page:** Recording mode = `always`.
6. **Visit `/api/recordings/diagnostics`** after redeploying — it will tell you exactly what (if anything) is still wrong.
7. Make a test call **>30 s**, hang up, wait ~60 s, refresh `/recordings`.
