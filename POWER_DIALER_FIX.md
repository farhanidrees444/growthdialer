# Power Dialer Fix

## Root Cause of Original Break

The original implementation had a partial state machine: it lacked pause/resume support, no localStorage persistence for refresh recovery, no proper API routes for pause/resume, the next-lead API didn't count remaining queue, and the UI was a small floating overlay rather than a proper full-center countdown stage with a persistent banner. The `use-power-dial.ts` hook had a flat model (just `isActive` + countdown number) with no formal states, making it impossible to correctly handle the `paused ↔ active` transition or show per-state UI.

---

## Files Modified

### New files created
| File | Purpose |
|---|---|
| `app/api/dialer/power-session/[id]/pause/route.ts` | POST → sets session status to `paused` |
| `app/api/dialer/power-session/[id]/resume/route.ts` | POST → sets session status back to `active` |
| `hooks/use-power-dialer.ts` | Full state-machine hook replacing `use-power-dial.ts` |
| `components/dialer/power-banner.tsx` | Persistent top banner (desktop + mobile responsive) |
| `components/dialer/power-countdown.tsx` | Full center-stage countdown with SVG ring |
| `POWER_DIALER_FIX.md` | This document |

### Modified files
| File | Change |
|---|---|
| `app/api/dialer/power-session/start/route.ts` | Accepts `{ delay_seconds, auto_stop_after, skip_after_disposition }` body |
| `app/api/dialer/power-session/[id]/next/route.ts` | Returns `queue_remaining` count; returns `{ ended, reason }` on empty queue |
| `app/api/dialer/power-session/[id]/end/route.ts` | Returns `{ summary: { calls, connects, meetings, duration } }` |
| `app/api/dialer/power-session/active/route.ts` | Now returns `active` OR `paused` sessions (for refresh resume) |
| `app/(dashboard)/dialer/page.tsx` | Uses new hook + components; removed old floating overlay/indicator |

---

## New Flow Diagram

```
idle
 │
 ├─[start()]──────────────────────────────────────────────────────────┐
 ▼                                                                     │
starting                                                               │
 │ API: POST /power-session/start                                      │
 │ Returns: { session, firstLead }                                     │
 ▼                                                                     │
preview ◄──────────────────────────────────────────────────────────── ┘
 │  [lead loaded, countdown timer running]
 │  UI: PowerCountdownStage (full center) + PowerBanner (top)
 │
 ├─[countdown → 0]────────────► fires onShouldDial(lead)
 │                               page calls initiateCall(lead.phone)
 │
 ├─[skipCountdown()]──────────► fires onShouldDial(lead) immediately
 │
 ├─[pause()]──────────────────► paused ──[resume()]──► preview (restart countdown)
 │
 └─[stop()]───────────────────► ending ──[dismissSummary()]──► idle

                                         ▼ (after initiateCall)
                                       calling
                                         │  UI: LiveCallStage + PowerBanner
                                         │
                                         ├─[callStatus → ended]
                                         │  page calls powerDialer.onCallEnd()
                                         ▼
                                      disposition
                                         │  UI: DispositionModal
                                         │
                                         └─[onDispositionSaved()]
                                            API: POST /power-session/[id]/next
                                            ▼
                                         countdown  (fetching next lead)
                                            │
                                            ├─[nextLead found]──► preview (loop)
                                            │
                                            └─[queue empty]──────► ending → idle
```

---

## API Contract

### POST `/api/dialer/power-session/start`
```json
// Body (all optional)
{ "delay_seconds": 5, "auto_stop_after": 50, "skip_after_disposition": ["dnc"] }

// Response
{ "session": {...}, "session_id": "uuid", "firstLead": {...}, "queueSize": 42, "delay_seconds": 5 }
```

### POST `/api/dialer/power-session/[id]/next`
```json
// Body
{ "excludeLeadId": "uuid", "calledLeadIds": ["uuid", ...], "current_disposition": "voicemail" }

// Response (has lead)
{ "next_lead": {...}, "queue_remaining": 18, "done": false }

// Response (queue empty)
{ "ended": true, "reason": "queue_empty", "queue_remaining": 0 }
```

### POST `/api/dialer/power-session/[id]/pause`
```json
// Response
{ "session": { "id": "...", "status": "paused", ... } }
```

### POST `/api/dialer/power-session/[id]/resume`
```json
// Response
{ "session": { "id": "...", "status": "active", ... } }
```

### POST `/api/dialer/power-session/[id]/end`
```json
// Response
{
  "session": { ... },
  "summary": { "calls": 15, "connects": 6, "meetings": 2, "duration": 1842 }
}
```

### GET `/api/dialer/power-session/active`
```json
// Response — returns active OR paused sessions
{ "activeSession": { "id": "...", "status": "active|paused", ... } | null }
```

---

## State Machine States

| State | Description |
|---|---|
| `idle` | No session running |
| `starting` | API call in flight to create session |
| `countdown` | Between calls — fetching next lead |
| `preview` | Lead loaded, countdown timer running. UI shows PowerCountdownStage |
| `calling` | Live call active. UI shows LiveCallStage |
| `paused` | Countdown frozen. Timer stopped. |
| `disposition` | Call ended, awaiting DispositionModal input |
| `ending` | Session ended, summary modal shown |

---

## localStorage Persistence

Key: `pd_session_v2`

Stored: `{ sessionId, leadId, countdownStart }`

On mount: if key exists, calls `/api/dialer/power-session/active` — if session matches, restores session state (active/paused). Countdown restarts fresh on resume.

---

## Test Checklist

1. ✅ Start session → countdown appears in center stage
2. ✅ Countdown completes → call initiates automatically (onShouldDial)
3. ✅ Mid-call: PowerBanner with STOP button always visible at top
4. ✅ Disposition saved → next countdown begins
5. ✅ Pause → countdown freezes, banner shows "Paused"
6. ✅ Resume → countdown restarts from full delay_seconds
7. ✅ Stop → confirmation modal → summary → back to idle
8. ✅ Refresh during session → session restored from localStorage + active API
9. ✅ Queue empty → auto-stops with summary modal
10. ✅ Mobile: STOP button prominent (red, full label) in compressed banner
