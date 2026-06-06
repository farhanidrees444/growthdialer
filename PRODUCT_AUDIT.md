# GrowthDialer — Full Product Audit (Jun 2026)

> Honest scorecard vs Smartlead / Orum / PhoneBurner tier. **10/10 = ship as-is.** Everything below 8 needs work.

## Executive summary

| Area | Score | Verdict |
|------|-------|---------|
| Dialer core logic | 7/10 | Works; parallel/power solid; coaching audio bridge missing |
| Dialer UI/UX | 5/10 | Dark glass OK; not "trillion-dollar" — fragmented styles |
| Backend / API | 7/10 | Workspace-scoped; gaps on delete billing, stale calls |
| Infrastructure | 6/10 | Telnyx webhooks OK; shared SIP; no realtime everywhere |
| Settings / workspace | 4/10 | Create yes; delete/rename API only — **no UI** |
| Marketing site | 8/10 | Keep; align claims with product |
| Team / billing | 7/10 | Functional; duplicated team surfaces |

---

## Critical gaps (fix first)

1. **Workspace delete** — API exists, zero UI → Settings → Workspace tab (shipping now)
2. **Coaching Listen/Whisper/Barge** — UI only; no Telnyx conference bridge
3. **Stale `calls` rows** — parallel dial orphans (partially fixed)
4. **Live insights panel** — "Coming v2" during live call — biggest premium gap
5. **Design tokens** — `#7C3AED` inline vs `gradient-brand` oklch — pick one system

---

## Dialer modes

### Manual (Browse → Preview → Live) — 7/10 logic, 6/10 UI
- ✅ Stage machine, disposition, AI brief
- ❌ Browse empty state thin; no today KPIs
- ❌ Hand-rolled modals vs shadcn Dialog/Sheet

### Power Dial — 7/10 logic, 6/10 UI
- ✅ Countdown, session, queue advance
- ❌ Banner + header overlap during live
- ❌ Session summary uses emoji not Lottie/motion wrap

### Parallel Dial — 8/10 logic, 5/10 UI
- ✅ First-winner, AMD, VM drop, realtime legs
- ❌ Line grid = status board not "war room"
- ❌ No per-line timer, listen-in, batch progress ring

---

## Backend issues

| Issue | Severity |
|-------|----------|
| Workspace DELETE no Stripe cancel | High |
| `user_settings` not workspace-scoped | Medium |
| Voicemails per-user not per-workspace | Medium |
| Per-user Telnyx SIP (parallel bridge) | High |
| Sequences enroll UI missing | Medium |
| HubSpot needs env + matching contacts | Low |

---

## Pages — keep vs modernize

| Page | Score | Action |
|------|-------|--------|
| Marketing homepage | 8/10 | Keep |
| Pricing | 8/10 | Keep |
| **AI Dialer** | 5/10 | **Modernize** (this wave) |
| Dashboard | 6/10 | Bento + Lottie empty states |
| Leads | 7/10 | Polish filters only |
| Coaching | 5/10 | Fix stale calls ✅; audio bridge later |
| Settings | 4/10 | **Workspace tab** (this wave) |
| Sequences | 5/10 | Builder OK; enroll from leads |
| Leaderboard | 7/10 | Minor polish |
| Integrations | 6/10 | HubSpot live |

---

## Modern UI stack (target)

- **shadcn/ui** — Button, Switch, AlertDialog, Sheet, Badge (replace raw buttons)
- **lottie-react** — empty states, dialer hero (already in package.json)
- **Framer Motion** — keep; standardize spring config
- **Design tokens** — `gradient-brand`, `DialerSurface`, no raw hex in components

---

## Roadmap waves

**Wave A (now):** Workspace settings, dialer premium shell, Lottie browse, parallel grid upgrade  
**Wave B:** Live insights real data, coaching Telnyx bridge, Sheet modals on dialer  
**Wave C:** Dashboard bento, sequences bulk enroll, design system pass all pages  
**Wave D:** Stripe on workspace delete, per-user SIP, CRM depth  
