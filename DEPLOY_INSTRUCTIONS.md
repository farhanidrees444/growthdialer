# 🚀 GROWTHDIALER FIXES — GITHUB PAR PUSH KARNE KE 3 RAASTAY

8 commits ready hain. Saari fixes safe hain — backward compatible — kuch bhi nahi torta.

## 📦 Yeh Mila Hai (8 commits)

| # | Commit | Severity | Files |
|---|---|---|---|
| 1 | fix(recordings): repair empty page + diagnostics endpoint | 🔴 P0 | 7 |
| 2 | fix(voice): accept TELNYX_TELEPHONY_CREDENTIAL_ID [P0-1] | 🔴 P0 | 1 |
| 3 | fix(calls): set started_at on outbound dial [P0-3] | 🔴 P0 | 3 |
| 4 | fix(stripe): correct apiVersion + safe init + real DB updates [P0-4 + P2-4] | 🔴 P0 | 4 |
| 5 | build: add ws + @types/ws (Telnyx peer dep) [P0-5] | 🔴 P0 | 2 |
| 6 | fix(metrics): resilient analytics_id handling [P0-2] | 🔴 P0 | 2 |
| 7 | security: lock down hangup, AI routes, health, INTERNAL_API_SECRET [P1-5/6/7/8 + P2-2/3] | 🟠 P1 | 6 |
| 8 | security: verify Telnyx webhook ed25519 signature [P1-4] | 🟠 P1 | 4 |

**Total: 25 files changed, 7,686 insertions, 134 deletions, 4 new migrations.**

---

## 🛤️ RAASTA 1 — Personal Access Token (SAB SE FAST, 30 seconds)

1. GitHub par jaen: **https://github.com/settings/tokens/new**
2. **Note:** `growthdialer-emergent-push`
3. **Expiration:** 7 days (zaroorat baad mein delete kar dena)
4. **Scope:** sirf ✅ `repo` (full control of private repos) check karein
5. **Generate token** → token copy karein (`ghp_...` se start hota hai)
6. Chat mein mujhe likhein: **"PAT: ghp_xxxxxxxxxxxxx"**
7. Main 5 second mein push kar doonga
8. ⚠️ Phir token revoke karein: https://github.com/settings/tokens (security)

---

## 🛤️ RAASTA 2 — Patch File aap Locally Apply Karein (5 min)

Main ne 8 separate patch files banaye hain. Aap apne local VS Code mein:

### Step 1 — Yeh chat ke patches mujh se copy karein

Mujhe likhein: **"patch 1 do"** ... **"patch 8 do"** (ek-ek karke), ya **"sab patches ek saath"** — main paste kar doonga.

### Step 2 — Local mein apply karein
```bash
cd /path/to/growthdialer
# Pehle clean state hona chahiye
git status                    # uncommitted changes commit ya stash karein
git checkout main
git pull

# Patches apply karein (order important)
git am /path/to/0001-*.patch
git am /path/to/0002-*.patch
# ... 8 tak
# YA sab ek baar:
git am /path/to/*.patch

# Push
git push origin main
```

### Agar `git am` mein conflict aaye:
```bash
git am --abort
# Single combined patch use karein:
git apply /path/to/all-fixes.patch
git add -A
git commit -m "Apply Emergent fixes (8 P0+P1 issues)"
git push
```

---

## 🛤️ RAASTA 3 — Git Bundle (sab se safe, 2 min)

Bundle ek single binary file hai jo saari Git history rakhti hai.

### Step 1 — Mujhe likhein: **"bundle do"** — main file content text mein paste karoonga
(Bundle binary hai, base64 encoded karna padega — ya...)

### Better: aap GitHub par fix-branch banayen, main woh use karoonga

```bash
# Local mein:
cd /path/to/growthdialer
git checkout -b emergent-fixes
git push origin emergent-fixes
```

Phir aap mujhe PAT dein (Raasta 1) — main `emergent-fixes` branch par push karoonga, aap PR bana lenge.

---

## ⚙️ MANUAL TASKS — AAP KO YEH KARNA HAI (5 minute, zaroori)

Push hone ke baad **Vercel deploy** karein, phir yeh karein:

### A) Supabase SQL Editor mein chalayein (order mein):

```sql
-- 1. Migration 030 — recording duration column
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS recording_duration_seconds INTEGER;
CREATE INDEX IF NOT EXISTS idx_calls_user_recording
  ON public.calls (user_id, started_at DESC)
  WHERE recording_url IS NOT NULL;

-- 2. Migration 031 — backfill started_at (P0-3 ke liye)
UPDATE public.calls
SET started_at = created_at
WHERE started_at IS NULL AND created_at IS NOT NULL;

UPDATE public.calls
SET direction = 'outbound'
WHERE direction IS NULL AND telnyx_call_id IS NOT NULL;

-- 3. Migration 032 — user plan columns (Stripe webhook ke liye)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_ended_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_customer
  ON public.user_settings (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_subscription
  ON public.user_settings (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- 4. Migration 033 — analytics_id + AI columns (P0-2 ke liye)
-- Pura content supabase/migrations/033_ensure_ai_columns.sql se copy karein
-- ya yeh chalayein:
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS analytics_id UUID,
  ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_processing_status TEXT,
  ADD COLUMN IF NOT EXISTS ai_error TEXT,
  ADD COLUMN IF NOT EXISTS ai_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_sentiment_score NUMERIC,
  ADD COLUMN IF NOT EXISTS ai_summary JSONB,
  ADD COLUMN IF NOT EXISTS ai_keywords JSONB,
  ADD COLUMN IF NOT EXISTS ai_next_steps JSONB,
  ADD COLUMN IF NOT EXISTS ai_objections JSONB,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS recording_supabase_path TEXT,
  ADD COLUMN IF NOT EXISTS was_recorded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transcript TEXT;
```

### B) Vercel → Settings → Environment Variables — yeh add karein:

| Var | Value | Kahan se milega? |
|---|---|---|
| `TELNYX_PUBLIC_KEY` | (base64 string) | Telnyx Portal → API Keys → "Public Key" copy |
| `INTERNAL_API_SECRET` | (any 32+ char random) | `openssl rand -hex 32` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks → endpoint → Signing secret (jab aap Stripe enable karein) |

**Aap pehle se yeh set kar chuke hain (handoff se confirm):**
- ✅ TELNYX_API_KEY
- ✅ TELNYX_CONNECTION_ID
- ✅ TELNYX_TELEPHONY_CREDENTIAL_ID
- ✅ TELNYX_FROM_NUMBER
- ✅ APP_URL / NEXT_PUBLIC_APP_URL = https://www.growthdialer.com
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ GROQ_API_KEY
- ✅ GEMINI_API_KEY

### C) Telnyx Portal mein 1 cheez verify karein:

1. Telnyx Portal → **Voice → Programmable Voice → Applications → growthdialer**
2. Webhook URL exactly yeh hona chahiye: `https://www.growthdialer.com/api/telnyx/webhook` ✅ (handoff se confirmed)

**Public Key copy karein:**
1. Telnyx Portal → **Account → API Keys**
2. Bottom mein **"Public Key"** section
3. Copy karein → Vercel mein `TELNYX_PUBLIC_KEY` mein paste karein

---

## ✅ POST-DEPLOY TESTING (10 min)

Vercel deploy ho jaye + migrations chal jayein + env vars set ho jayein, phir:

### Test 1 — WebRTC outbound dial (P0-1 fix verify)
1. growthdialer.com par login karein
2. Dialer kholain → koi number type karein → Dial dabaen
3. Browser mic permission allow → call ringing honi chahiye
4. Vercel logs mein: `[voice/token]` warning **NAHI** dikhna chahiye

### Test 2 — Dashboard stats (P0-3 fix verify)
1. Pehle ek **30+ second** call karein
2. Dashboard kholain → Number Health card → real numbers dikhna chahiye
3. My Numbers page → number ke saath "Total calls" 0 nahi hona chahiye

### Test 3 — Recordings (P2-1 fix verify)
1. Wahi 30s+ call jo abhi ki — Recordings page kholain
2. Recording dikhni chahiye ~60 second mein
3. Agar nahi dikhi: `https://www.growthdialer.com/api/recordings/diagnostics` open karein (logged-in browser mein) → JSON report milegi exact reason ke saath

### Test 4 — Build (P0-5 fix verify)
- Vercel deploy success ho jana chahiye (`Module not found: ws` error nahi)

### Test 5 — Webhook signature (P1-4 fix verify)
1. `TELNYX_PUBLIC_KEY` set ho gaya?
2. Test call karein → Vercel logs check karein
3. Yeh log dikhna chahiye: `[WEBHOOK] call.answered` (NOT `[WEBHOOK] Signature verification FAILED`)
4. Agar fail aaye → `TELNYX_PUBLIC_KEY` value sahi se copy nahi hui — Telnyx Portal se dobara copy karein

---

## 🆘 KOI BAAT GHALAT HO TOH

Vercel logs mein in prefixes par grep karein:

| Log | Matlab |
|---|---|
| `[voice/token] no TELNYX_TELEPHONY_CREDENTIAL_ID set` | P0-1 env var rename pending — old name ke saath bhi kaam karega lekin warning aati rahegi |
| `[dashboard/metrics] analytics_id missing` | Migration 033 nahi chala |
| `[WEBHOOK] Signature verification FAILED: missing_signature_or_timestamp` | Telnyx purane API v1 use kar raha hai — Telnyx app settings mein "API v2" select karein |
| `[WEBHOOK] Signature verification FAILED: signature_mismatch` | `TELNYX_PUBLIC_KEY` galat copy hua |
| `[STRIPE-WEBHOOK] Service client unavailable` | `SUPABASE_SERVICE_ROLE_KEY` missing |
| `[AI] INTERNAL_API_SECRET is not configured` | Add karein Vercel mein |
| `[REC-B] NO recording URL in payload` | Telnyx storage configured nahi — Voice App → Recording Storage = "Telnyx S3" |

---

## 🎯 RECOMMENDED ACTION

**Raasta 1 (PAT) sab se simple hai.** Token banayein, mujhe dein, main push kar doonga, aap delete kar dein.

Agar PAT comfortable nahi, **Raasta 2 (patches)** karein — main aap ko ek-ek paste kar dunga.

**Sawaal:**
- "PAT: ghp_xxx" → main abhi push kar doonga
- "patches do" → main 8 patch content paste kar doonga
- "bundle do" → main bundle file ka content batauonga
