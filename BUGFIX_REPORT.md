# AI Dialer Bug Fix Report

**Date:** 2026-05-20  
**Engineer:** Claude (Sonnet 4.6)  
**Branch:** main

---

## Bug 1 — Calls Going Straight to Voicemail (AMD Misconfiguration)

### Root Cause
The server-side Telnyx dial API call in `app/api/calls/dial/route.ts` was missing the `answering_machine_detection`, `timeout_secs`, and `time_limit_secs` fields. Without `answering_machine_detection: 'disabled'`, Telnyx defaults to its AMD algorithm, which frequently misclassifies the initial ring cadence as voicemail and terminates the call before the recipient even picks up — especially on mobile numbers.

### Files Modified
- `app/api/calls/dial/route.ts`

### Code Change

**Before:**
```ts
const result = await (telnyxClient.calls.dial as any)({
  connection_id: process.env.TELNYX_CONNECTION_ID!,
  to: e164,
  from: fromNumber,
  webhook_url: webhookUrl,
  webhook_url_method: 'POST',
});
```

**After:**
```ts
const result = await (telnyxClient.calls.dial as any)({
  connection_id: process.env.TELNYX_CONNECTION_ID!,
  to: e164,
  from: fromNumber,
  webhook_url: webhookUrl,
  webhook_url_method: 'POST',
  answering_machine_detection: 'disabled',  // prevents false voicemail routing
  timeout_secs: 30,                          // ring for 30s before no-answer
  time_limit_secs: 14400,                    // max call duration 4 hours
});
```

### How to Verify
1. Make a server-side call to a mobile number
2. The phone should ring — call should NOT route to voicemail before ringing
3. Check Telnyx dashboard → Call Logs → verify `answering_machine_detection` shows `disabled`

> **Note:** This only affects the **server-side fallback** dial path (used when WebRTC is unavailable). Browser WebRTC calls (the primary path) are not affected — they dial directly from the browser SDK and do not pass through this route's dial params.

### Telnyx Dashboard Verification
- Go to Telnyx Portal → Call Control → your Connection
- Confirm no AMD is enabled at the Connection level either (it should be off by default)

---

## Bug 2 — Power Dialer Broken (Regression in Rebuild)

### Root Cause
The dialer page rebuild had stubbed out the Power Dial button with `toast.info('Power dial coming soon')`. The entire power dial session lifecycle (start, advance, skip, end, resume) was missing.

### Files Created
- `hooks/use-power-dial.ts` — full session hook with countdown, auto-advance, resume-on-load
- `app/api/dialer/power-session/start/route.ts` — POST: ends any orphaned session, creates new, returns first lead
- `app/api/dialer/power-session/[id]/next/route.ts` — POST: fetches next un-called lead (with exclusion list)
- `app/api/dialer/power-session/[id]/end/route.ts` — POST: marks session ended, returns summary
- `app/api/dialer/power-session/active/route.ts` — GET: returns active session for page-reload resume

### Files Modified
- `app/(dashboard)/dialer/page.tsx` — wired `usePowerDial` hook; Power Dial button now opens confirm modal; `handleDispositionSave` calls `advanceToNext()` when power dial is active

### Session Lifecycle
```
User clicks "Power Dial" button
  → confirm modal: shows queue size
  → POST /api/dialer/power-session/start
    → ends any orphaned active session
    → creates new power_dial_sessions row
    → fetches first lead (priority sort)
    → returns {session, firstLead, queueSize}
  → onLeadReady(firstLead) → mode='preview' → user dials
  → call ends → disposition modal
  → handleDispositionSave calls advanceToNext(leadId, connected, meeting)
    → updates session stats in DB
    → 5-second countdown overlay
    → POST /api/dialer/power-session/[id]/next
    → onLeadReady(nextLead) OR endSession() if done
  → page reload: GET /api/dialer/power-session/active resumes session
```

### How to Verify
1. Import ≥3 leads, ensure they have valid phone numbers
2. Click "Power Dial" in the dialer sidebar → confirm modal appears showing queue count
3. Click "Start Session" → first lead loads in preview mode
4. Dial → call ends → disposition modal → save disposition
5. A 5-second countdown overlay appears, then the next lead auto-loads
6. After last lead: session summary toast appears
7. Reload the page mid-session → "Power dial session resumed" toast should appear

### Required DB Table
The `power_dial_sessions` table must exist with at minimum:
```sql
CREATE TABLE power_dial_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  status text DEFAULT 'active',
  total_calls integer DEFAULT 0,
  connected_calls integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  total_talk_time integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);
```

---

## Bug 3 — Manual Dialpad Country Code Wrong (Hardcoded +1)

### Root Cause
The original `ManualDialpadOverlay` component hardcoded `'+1'` in both `validatePhone()` and `dial()`. Regardless of the user's actual purchased number country, the dialpad always treated input as a US number — causing validation failures and wrong E.164 numbers for international users.

### Files Modified
- `components/dialer/manual-dialpad-overlay.tsx` — complete rewrite of validation, display, and dial logic

### Changes Made

| Area | Before | After |
|------|--------|-------|
| Country detection | Hardcoded `'+1'` | Fetches user's `purchased_numbers` from Supabase, uses `is_default=true` number, derives country via `libphonenumber-js` |
| Country picker | None | Full dropdown with all countries (flag + name + dial code), priority countries shown first |
| Phone display | Raw digits | `formatDisplay()` using `libphonenumber-js` national format for selected country |
| Validation | Always US format | `validatePhone()` validates against selected `CountryCode` |
| Dial | `'+1' + digits` | `+{dialCode}{digits}` built from selected country's calling code |
| No numbers state | None | "Buy a Number" CTA to `/numbers` when user has no purchased numbers |
| Recents | Local E.164 | Full E.164 stored; stripped to local digits when loaded back into dialpad |

### TypeScript Fix
The initial rewrite used `.then().catch()` chaining on the Supabase query, which returns `PromiseLike<void>` (no `.catch()` method). Fixed by converting to `async/await` inside an IIFE inside `useEffect`.

### How to Verify
1. Open the manual dialpad
2. Country picker should auto-select based on your default purchased number's country
3. Type digits → they should format in the selected country's national format
4. UK number (+44): select GB, type 7911 123456 → should show `7911 123456` and validate as "Valid mobile"
5. US number: select US, type 2025551234 → should show `(202) 555-1234` and validate
6. Dial → E.164 should be correct for the selected country
7. If no purchased numbers: dialpad shows "Buy a Number" instead of keypad

---

## Bug 4 — Fanytel Numbers Compatibility (DIAGNOSIS)

### Investigation Findings

After a full codebase audit, **"Fanytel" does not exist anywhere in this codebase**:

- No `provider` column in the `purchased_numbers` table schema (migrations 006 and earlier confirm the columns: `id`, `user_id`, `phone_number`, `country`, `country_code`, `country_name`, `number_type`, `region`, `locality`, `monthly_cost`, `is_default`, `status`, `purchased_at`, `telnyx_number_id`, `telnyx_order_id`)
- No Fanytel API calls in any route
- No Fanytel environment variables
- All number purchases go through `https://api.telnyx.com/v2/number_orders` in `/api/numbers/purchase/route.ts`
- WebRTC credentials are issued from `https://api.telnyx.com/v2/telephony_credentials/{id}/token`

### Root Cause of Compatibility Issues

If a user has Fanytel numbers (numbers purchased outside the app, from Fanytel's platform), they cannot be used because:

1. **No provider field**: The app has no way to distinguish a Fanytel number from a Telnyx number in the DB
2. **From-number routing**: The `dial` route uses the user's default `purchased_numbers` entry as the `from` number. If a manually-inserted Fanytel number is set as default, Telnyx will reject the call (Telnyx does not own that number)
3. **WebRTC audio**: All WebRTC audio flows through Telnyx SIP infrastructure. Outbound calls must originate from a Telnyx-registered number or a BYOC (Bring Your Own Carrier) number ported to Telnyx

### What "Fanytel compatibility" would require

**Option A — Port Fanytel numbers to Telnyx (recommended)**
- Port the Fanytel numbers to Telnyx via the number porting flow
- They become Telnyx numbers and work automatically
- No code changes needed

**Option B — Telnyx BYOC (Bring Your Own Carrier)**
- Set up a Telnyx BYOC trunk pointing to Fanytel's SIP termination endpoint
- Fanytel numbers registered on this trunk appear as Telnyx numbers
- The `from` field in dial can then use the Fanytel E.164
- Requires Telnyx BYOC configuration and a new `connection_id` for BYOC calls

**Option C — Add Fanytel as a second carrier (significant work)**
1. Add `provider text DEFAULT 'telnyx'` column to `purchased_numbers`
2. Build `/api/numbers/purchase-fanytel` route using Fanytel's API
3. Add a `FANYTEL_API_KEY` env var
4. Branch call routing in `dial/route.ts` based on `provider`
5. WebRTC audio for Fanytel calls would need a Fanytel SIP WebSocket endpoint (or use Telnyx BYOC bridge)

### Immediate Steps to Unblock
If you have Fanytel numbers you need working NOW:
1. Port them to Telnyx (1-3 business days, no code changes)
2. OR set up Telnyx BYOC with Fanytel SIP trunking

### Status
No code changes made for Bug 4 — this is a configuration and architecture decision. The diagnosis above gives the path forward.

---

## Environment Variables to Verify (Vercel)

| Variable | Purpose | Required |
|----------|---------|---------|
| `TELNYX_API_KEY` | Server-side Telnyx API calls | Yes |
| `TELNYX_CONNECTION_ID` | Which SIP connection to use for server-side dial | Yes |
| `TELNYX_CREDENTIAL_ID` | Issues short-lived WebRTC tokens | Yes |
| `NEXT_PUBLIC_TELNYX_SIP_USERNAME` | WebRTC SIP login (fallback) | Recommended |
| `TELNYX_SIP_PASSWORD` | WebRTC SIP password (fallback) | Recommended |
| `TELNYX_FROM_NUMBER` | Fallback caller ID if no default purchased number | Recommended |
| `APP_URL` | Full URL for Telnyx webhook callback | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role for server-side ops | Yes |
| `GEMINI_API_KEY` | AI brief generation | Yes |

---

## Telnyx Dashboard Settings to Verify

1. **Call Control Application** (your Connection):
   - Webhook URL: `{APP_URL}/api/telnyx/webhook`
   - Webhook API Version: API v2
   - Answering Machine Detection: **Disabled** (also set at API level per Bug 1)

2. **SIP Credentials / Telephony Credential** (`TELNYX_CREDENTIAL_ID`):
   - Must be a WebRTC credential type
   - Linked to same Connection as above

3. **Phone Numbers**:
   - All active numbers must be assigned to the Call Control Connection

---

## TypeScript Build Status

All TypeScript errors have been resolved. Run to verify:

```bash
npx tsc --noEmit
```

Expected output: (no output = zero errors)
