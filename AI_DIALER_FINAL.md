# AI Dialer — Final Fix Report

## Root Cause

**Double-call bug.** `initiateCall` was making TWO simultaneous outbound calls to the same number:
1. `POST /api/calls/dial` (no `call_control_id`) → server-side Telnyx call with no browser audio
2. `makeCall(e164)` → WebRTC call with browser audio

This produced:
- Audio issues on Fanytel calls (server-side call competes with WebRTC call)
- "On Call" indicator appearing then disappearing (competing call states)
- Notes and disposition silently failing (server-side `call_control_id` stored as `pendingCallDbId` but notes/disposition APIs require the DB row UUID)

---

## Files Modified

### `contexts/webphone-context.tsx`
Added `onCallCreated?: (callId: string) => void` callback parameter to `makeCall`. Fires synchronously after `clientRef.current.newCall()` with the WebRTC call's `call_control_id`. This lets the caller register the DB record with the correct ID without making a second Telnyx call.

### `app/(dashboard)/dialer/page.tsx`
- **`initiateCall`**: Removed the pre-flight `POST /api/calls/dial` that was creating a server-side call. Now calls `makeCall(e164, undefined, callback)` only. The callback fires with the WebRTC call_control_id, which is sent to `/api/calls/dial` (triggering WebRTC-registration branch, not server-side dial). DB UUID (`db_id`) stored as `pendingCallDbId`.
- **`handleDropVoicemail`**: Changed from `pendingCallDbId` (DB UUID) to `activeCallId` (live WebRTC call_control_id) — the VM drop API needs the Telnyx call_control_id, not the DB row ID.
- **`LiveCallStage callDbId`**: Changed from `activeCallDbId` (stale snapshot at mode-transition time) to `pendingCallDbId` (live state, updates to DB UUID once API responds). This fixes notes auto-save and record toggle.

### `app/api/calls/dial/route.ts`
In the WebRTC branch (`call_control_id` provided): changed `.insert()` to `.insert().select('id').single()` and returns `db_id` alongside `call_control_id`. The client uses `db_id` for notes/disposition/record APIs.

---

## Files Deleted (dead code)

| File | Reason |
|------|--------|
| `hooks/useTwilioDevice.ts` | Twilio SDK hook, not imported anywhere. Vendor replaced by Telnyx. |
| `lib/twilio.ts` | Twilio library wrapper, not imported anywhere. |
| `hooks/use-power-dial.ts` | Old power dialer (v1). Superseded by `hooks/use-power-dialer.ts`. Not imported. |

---

## Single Source of Truth for Call State

| Data | Where stored | Used for |
|------|-------------|---------|
| WebRTC call status | `webphone-context.tsx` → `callStatus` | Mode transitions, UI state |
| Live call_control_id | `webphone-context.tsx` → `activeCallId` | VM drop, future Telnyx actions |
| DB row UUID | `dialer/page.tsx` → `pendingCallDbId` | Notes, disposition, record toggle |
| Dialer mode | `hooks/use-dialer-mode.ts` → `mode` | Page layout (browse/preview/live) |

No Zustand store added — the existing hooks + context are sufficient. Call state is not duplicated.

---

## Phone Formatting

`lib/phone.ts` `normalizePhone()` is called before every dial:
- Applied in: `dialer/page.tsx` `initiateCall`
- Applied in: `app/api/calls/dial/route.ts` (server-side fallback path)
- Handles: `(123) 456-7890`, `1234567890`, `+11234567890`, E.164 already

---

## Call Flow After Fix

```
User clicks Call
  → initiateCall(phone, lead)
  → phoneStatus === 'ready' check
  → makeCall(e164, undefined, callback)          ← single WebRTC call only
      → TelnyxRTC.newCall() fires
      → callback(call.id) fires synchronously
      → POST /api/calls/dial { to, lead_id, call_control_id }  ← DB registration only
      → response: { db_id, call_control_id }
      → setPendingCallDbId(db_id)
  → telnyx.notification: state='ringing' → callStatus='ringing'
  → telnyx.notification: state='active'  → callStatus='active'
  → useEffect: prev=ringing, curr=active → startCall() → mode='live'
  → LiveCallStage renders with callDbId=pendingCallDbId (DB UUID)
  → Notes, record toggle, disposition all work
```

---

## Build Status

```
✓ Build: PASSED (zero errors, zero warnings)
```

---

## What Was NOT Changed

- Leads page, Dashboard, Analytics, Recordings — untouched
- Phone number normalization logic — already correct
- Webhook handler — already correct
- Power dialer state machine — untouched
- Queue column sort/filter — sort is functional via `<select>`; filter button UI exists (no handler, not a regression)
