# Dialer Rebuild Audit Report

**Build date:** 2026-05-20  
**Build status:** ✅ Zero TypeScript errors, full Next.js build passes

---

## Files Created

### Utility Libraries
| File | Purpose |
|------|---------|
| `lib/dialer/state-machine.ts` | Mode types, disposition map, lead status mapping |
| `lib/dialer/avatar-color.ts` | Stable gradient + initials from lead ID |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/use-dialer-mode.ts` | State machine: browse → preview → live transitions |
| `hooks/use-call-realtime.ts` | Supabase Realtime subscriptions (calls + leads tables) |
| `hooks/use-dialer-hotkeys.ts` | Full keyboard shortcut system, mode-aware |
| `hooks/use-call-audio.ts` | Web Audio API waveform data from Telnyx audio element |

### API Routes (New)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/dialer/queue` | GET | Paginated lead queue with tab counts (queue/hot/callbacks) |
| `/api/dialer/lead-context/[leadId]` | GET | Lead + call history + Gemini AI brief |
| `/api/calls/[id]/disposition` | POST | Save disposition, update lead status, return next lead ID |

### Components
| File | Purpose |
|------|---------|
| `components/dialer/header-strip.tsx` | Always-visible top bar: stats, session replay, status pill |
| `components/dialer/session-replay-map.tsx` | Dot timeline of today's calls with hover tooltips |
| `components/dialer/queue-column.tsx` | Left panel: search, tabs, sorted lead list, sort/filter bar |
| `components/dialer/queue-lead-card.tsx` | 76px lead card with avatar, TZ pill, hot badge, disposition dot |
| `components/dialer/browse-stage.tsx` | Mode 1 empty state with AI orb, stats pills, Power Dial CTA |
| `components/dialer/preview-stage.tsx` | Mode 2: lead profile, call CTA, skip/hot/DNC, quick note |
| `components/dialer/live-call-stage.tsx` | Mode 3: avatar, waveform, timer, action dock, end call |
| `components/dialer/ai-brief-panel.tsx` | Right panel (preview): best time, talking points, memories, locked coach |
| `components/dialer/live-insights-panel.tsx` | Right panel (live): locked AI coach, lead context |
| `components/dialer/caller-waveform.tsx` | 32-bar audio visualizer using Web Audio API |
| `components/dialer/action-dock.tsx` | Hold, mute, notes, voicemail drop, DTMF, conference (v2 locked) |
| `components/dialer/disposition-modal.tsx` | 8-button grid modal with hotkeys 1–8, callback date picker |
| `components/dialer/manual-dialpad-overlay.tsx` | Right slide-in: phone input, dialpad grid, validation, recents |
| `components/dialer/shortcuts-help-modal.tsx` | Full keyboard shortcuts reference modal |
| `components/dialer/ai-orb.tsx` | Animated SVG orb with particles for browse empty state |

### Main Page
| File | Notes |
|------|-------|
| `app/(dashboard)/dialer/page.tsx` | **Complete rebuild** — 3-mode state machine, all wiring |

---

## Files Modified

| File | Change |
|------|--------|
| `app/(dashboard)/dialer/page.tsx` | Full rebuild (replaced 1775-line monolith) |

---

## Files Deleted

None — the old component files in `components/dialer/` are preserved and remain importable (they are not used by the new page but may be used by other pages or future features).

---

## New Dependencies Installed

None — all dependencies already present:
- `framer-motion` (animations)
- `libphonenumber-js` (phone validation in manual dialpad)
- `@base-ui/react` (Tooltip, Dialog, Sheet)
- `lucide-react` (icons)
- `sonner` (toasts)
- `@google/generative-ai` (AI brief generation)

---

## Manual Test Checklist (25 items)

### Mode 1 — Browse
- [ ] Page loads, shows "Select a lead to begin" with AI orb animation
- [ ] Queue column loads leads from `/api/dialer/queue`
- [ ] Search debounces at 300ms, filters by name/company/phone
- [ ] Tab switching (Queue/Hot/Callbacks) changes the lead list
- [ ] Tab counts reflect actual DB values
- [ ] Sort dropdown changes lead order
- [ ] Clicking a lead transitions to Mode 2 with spring animation
- [ ] Floating phone button visible bottom-right (desktop)
- [ ] `D` hotkey opens manual dialpad overlay
- [ ] `?` hotkey opens shortcuts modal
- [ ] `/` hotkey focuses the queue search input
- [ ] `↑↓` arrows navigate the queue, `Enter` selects lead

### Mode 2 — Preview
- [ ] Lead profile shows name, title, company, phone, TZ pill
- [ ] TZ pill shows red if outside TCPA hours (8am–9pm)
- [ ] `Call {Name}` button initiates WebRTC call via Telnyx
- [ ] `Space` hotkey starts call
- [ ] `S` skips to next lead
- [ ] `H` toggles hot status (updates DB, updates card badge)
- [ ] DNC button shows confirm dialog before marking
- [ ] Quick note textarea slides in/out on click
- [ ] AI Brief panel loads on right (xl breakpoint)
- [ ] AI brief shows best time, talking points, memory section

### Mode 3 — Live Call
- [ ] Stage transitions when WebRTC call becomes `active`
- [ ] Waveform animates (idle wave pre-connection, audio bars on active)
- [ ] Timer counts up from 00:00
- [ ] Mute button toggles WebRTC audio, turns red when active
- [ ] Hold button calls WebRTC hold/unhold
- [ ] Notes panel opens/closes, auto-saves every 800ms to `/api/calls/[id]/notes`
- [ ] Voicemail drop calls `/api/calls/drop-voicemail`
- [ ] DTMF keypad opens, sends tones via WebRTC `sendDTMF()`
- [ ] `Space` hotkey ends call
- [ ] Live banner shows timer + lead name in top strip

### Disposition Modal
- [ ] Opens automatically when call ≥ 10s and ends
- [ ] Skipped (auto-marks voicemail) when call < 10s
- [ ] 8 disposition buttons, each with hotkey badge
- [ ] Hotkeys 1–8 select disposition while modal is open
- [ ] Callback selected → date picker slides in with quick options
- [ ] Submitting saves to `/api/calls/[id]/disposition` and updates lead status
- [ ] Toast confirms save

### Manual Dialpad
- [ ] Slide-in animation from right (spring physics)
- [ ] Phone number formats live as you type
- [ ] Validation shows "✓ Valid US number" in green
- [ ] All 12 keypad buttons work, numbers auto-format
- [ ] Call button disabled until valid number
- [ ] Recents list persists in localStorage, shows last 5 numbers
- [ ] `Escape` closes overlay

### Responsive
- [ ] 375px: single column, mobile bottom bar visible
- [ ] 768px: queue and center only (no AI panel)
- [ ] 1024px: queue + center (2-col)
- [ ] 1280px: full 3-col (queue + center + AI panel)
- [ ] 1440px: same as 1280, more breathing room

---

## Known Limitations (UI-hook only, no backend)

| Feature | Status |
|---------|--------|
| AI Live Coach | UI locked with "Coming in v2" badge — no backend |
| Conference / Transfer | Locked with v2 badge in action dock |
| Power Dial | Shows toast "coming soon" — session management not wired to new UI |
| Timezone-safe sort | Implemented as `priority` sort; dedicated TZ-aware sort not yet built |
| Session replay modal | Clicking a dot in the header strip does not yet open a call detail modal |
| Lead memories (pgvector) | AI brief returns empty `memories: []` — vector search not implemented |

---

## Performance Notes

- **Queue query**: No N+1 — single query with joins, limit 50 rows  
- **Stats query**: Hits `/api/stats/today` on mount + Supabase Realtime refresh — no polling  
- **AI brief**: Generated on-demand by Gemini Flash, no caching layer yet (add `lead_briefs` table if latency is a concern)  
- **Waveform**: 60fps via `requestAnimationFrame` — uses Web Audio API which requires browser context, gracefully falls back to idle animation on error  
- **Bundle impact**: No new dependencies added; all imports already in the bundle

---

## Architecture Notes

- **WebRTC calls** go through `webphone-context.tsx` (unchanged) — Telnyx SDK handles audio
- **Call DB records** are created via `/api/calls/dial` at call initiation time
- **Disposition** is a separate POST to `/api/calls/[id]/disposition` after hangup
- **Mode transitions** are driven by `useDialerMode` hook + `callStatus` watcher in the page
- **Supabase Realtime** on `calls` table triggers stats + dot refresh after each call event
