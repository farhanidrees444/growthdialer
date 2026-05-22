# FIXES COMPLETE
## GrowthDialer — 4 Production Bug Fixes

---

## MIGRATIONS (run manually in Supabase SQL Editor)

### 019_soft_delete.sql ✅ CREATED
- Adds `deleted_at` / `deleted_by` columns (safe — 017 already added them)
- Adds partial index for fast "active leads" queries
- Adds RLS policy for soft delete

### 022_stripe_ready.sql ✅ CREATED
- Adds `stripe_subscription_id`, `stripe_product_id`, `billing_status`, `next_billing_date`, `auto_renew` to `purchased_numbers`
- Backfills `next_billing_date` for existing numbers (30d from purchase)
- Creates `stripe_customers` table with RLS

**Run order:** 019 → 022

---

## FIX 1: LEADS SOFT DELETE + TRASH + RESTORE

### Root Cause
`DELETE /api/leads/[id]` was doing a hard `delete()` — permanently destroying lead data. Dialer queue routes were not filtering soft-deleted leads.

### Files Changed
| File | Change |
|------|--------|
| `app/api/leads/[id]/route.ts` | DELETE handler: hard delete → soft delete (`UPDATE deleted_at`) |
| `app/api/dialer/queue/route.ts` | All 4 queries: added `.is('deleted_at', null)` |
| `app/api/leads/queue/route.ts` | Main query: added `.is('deleted_at', null)` |
| `app/(dashboard)/leads/page.tsx` | Modal text "30 days" → "7 days"; added `TrashLeadCard` with restore/delete-forever; `handleRestoreFromTrash` → dedicated restore endpoint; `handleDeleteForever` |
| `app/api/leads/[id]/restore/route.ts` | **CREATED** — POST endpoint to clear `deleted_at` |
| `app/api/cron/cleanup-trash/route.ts` | **CREATED** — Permanently deletes leads in trash > 7 days old |

### Test Results
- Delete lead → soft-deleted, appears in Trash tab with "Deleted X days ago" badge ✅
- Restore → lead back in All tab, gone from Trash ✅
- Deleted leads not in dialer queue ✅
- Delete Forever → permanent hard delete with confirmation ✅

---

## FIX 2: AI DIALER — ACTIVE CALL UI

### Root Cause
`ActionDock` was missing a Record button. No server-side call control routes existed for record, hold, or end.

### Files Changed
| File | Change |
|------|--------|
| `components/dialer/action-dock.tsx` | Added `isRecording`, `onToggleRecord` props; added Record button (Circle/Square icon, hotkey R) |
| `components/dialer/live-call-stage.tsx` | Added `isRecording` state; wired `onToggleRecord` → `POST /api/calls/[id]/record` |
| `app/api/calls/[id]/record/route.ts` | **CREATED** — POST record_start/record_stop via Telnyx Call Control |
| `app/api/calls/[id]/hold/route.ts` | **CREATED** — POST hold/unhold via Telnyx Call Control |
| `app/api/calls/[id]/end/route.ts` | **CREATED** — POST hangup via Telnyx Call Control |

### Architecture Note
- Hold/mute work via WebRTC SDK in browser (existing `toggleHold`, `toggleMute`)
- Record uses server-side Telnyx Call Control API (more reliable, supports dual-channel)
- All routes verify call ownership before calling Telnyx

---

## FIX 3: CALLS NOT GOING THROUGH — AMD STATUS

### Root Cause Check
`grep -r "answering_machine" .` → **only one occurrence**:
```
app/api/calls/dial/route.ts:74: answering_machine_detection: 'disabled'
```
AMD was already `'disabled'` everywhere. ✅ No code change needed for AMD itself.

### Additional Fixes
| File | Change |
|------|--------|
| `app/api/telnyx/webhook/route.ts` | Added `call.ringing` event handler (logs + updates call status; confirms receiver's phone is actually ringing); enhanced log line with `from` and `to` fields |

### Expected Webhook Sequence (healthy call)
1. `call.initiated` → session_id saved, status=ringing
2. `call.ringing` → **confirms receiver's phone is ringing** (logged, status updated)
3. `call.answered` → status=answered, recording starts
4. `call.hangup` → status=completed, duration saved, AI triggered

---

## FIX 4: MY NUMBERS — PURCHASE + DISPLAY + LIFECYCLE

### Root Cause
- Purchase route was saving to DB correctly ✅ but missing `billing_status` and `next_billing_date` columns
- List route not returning new billing columns
- No sync button for numbers bought outside the app
- No expiry warning on the UI
- Retail pricing not being applied (was showing wholesale)

### Files Changed
| File | Change |
|------|--------|
| `lib/pricing/calculate-price.ts` | **CREATED** — `calculateRetailPrice(wholesale)`: max(wholesale+3, wholesale×2), capped at 3× |
| `app/api/numbers/purchase/route.ts` | Added `billing_status='unpaid'`, `auto_renew=true`, `next_billing_date` (30d from now); improved DB error logging |
| `app/api/numbers/list/route.ts` | Added `billing_status, next_billing_date, auto_renew, stripe_subscription_id` to SELECT |
| `app/api/numbers/sync/route.ts` | **CREATED** — POST syncs all numbers from provider via upsert on `telnyx_number_id` |
| `app/api/cron/release-expired-numbers/route.ts` | **CREATED** — Releases numbers with no subscription past `next_billing_date` |
| `components/numbers/owned-number-card.tsx` | Shows retail price, billing status badge, renew countdown, inline expiry warning |
| `app/(dashboard)/numbers/page.tsx` | Added "Sync Numbers" button; added expiry warning banner for numbers < 7 days from expiry |

### Pricing Examples
| Wholesale | Retail |
|-----------|--------|
| $1.00 | $3.00 |
| $2.00 | $5.00 |
| $5.00 | $10.00 |
| $10.00 | $20.00 |

---

## NEW ENV VARS REQUIRED

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Auth token for cron endpoints (generate: `openssl rand -hex 32`) |

Add to Vercel environment variables. Both cron routes check:
```
Authorization: Bearer ${CRON_SECRET}
```

---

## vercel.json — CRON SCHEDULE

```json
{
  "crons": [
    { "path": "/api/cron/cleanup-trash", "schedule": "0 3 * * *" },
    { "path": "/api/cron/release-expired-numbers", "schedule": "0 4 * * *" }
  ]
}
```

Runs at 3 AM / 4 AM UTC daily.

---

## TYPESCRIPT STATUS

```
npx tsc --noEmit → 0 errors
```

---

*Fixes completed: 2026-05-22*
