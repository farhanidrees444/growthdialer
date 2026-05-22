# ENTERPRISE STACK REPORT
## GrowthDialer — Enterprise Build Complete

---

## PART 1 — TEAM ARCHITECTURE

### Migration Status
- `supabase/migrations/020_team_architecture.sql` — **CREATED** (manual run required in Supabase dashboard)
  - Tables: `workspaces`, `workspace_members`, `workspace_invitations`, `teams`, `team_members`
  - Altered: `leads`, `calls`, `purchased_numbers`, `voicemails`, `power_dial_sessions`, `user_settings` — all gain `workspace_id`
  - DO block auto-creates personal workspaces for all existing users + migrates their data
  - RLS policies: workspace isolation enforced at DB level
  - Indexes on all join columns

### Permissions System
- `lib/auth/permissions.ts` — **CREATED**
  - Roles: `owner > admin > manager > agent > viewer`
  - 20+ granular permissions covering workspace, members, calls, leads, recordings, analytics, numbers
  - `hasPermission()`, `can()`, `roleAtLeast()` helpers
  - `ROLE_LABELS` / `ROLE_COLORS` for consistent UI display

### Workspace Context
- `contexts/workspace-context.tsx` — **CREATED**
  - Global state: `currentWorkspace`, `currentRole`, `workspaces`, `members`
  - Actions: `setCurrentWorkspace`, `refreshWorkspaces`, `refreshMembers`, `inviteMember`, `removeMember`, `updateMemberRole`
  - `can(permission)` shortcut for UI gates
  - Persists selected workspace in `localStorage` (`gd-current-workspace`)
  - Mounted in `app/(dashboard)/layout.tsx` (wraps all dashboard routes)

### New Pages
- `app/(dashboard)/workspace/setup/page.tsx` — **CREATED**
  - Full-screen workspace creation flow
  - Plan selector: Free / Pro / Team with feature lists
  - Posts to `/api/workspaces` → refreshes context → redirects to dashboard

- `app/accept-invite/[token]/page.tsx` — **CREATED**
  - Public route (outside dashboard layout)
  - Fetches invite details via `GET /api/invitations/[token]/accept`
  - Shows workspace name + role being granted
  - Not logged in: Sign in / Create account links with `?redirect=` preserved
  - Logged in: Accept & Join button → `POST /api/invitations/[token]/accept`
  - Email mismatch warning with sign-out option
  - Sets `gd-current-workspace` in localStorage on acceptance

### API Routes — Team
| Route | Method | Status |
|-------|--------|--------|
| `/api/workspaces` | GET | ✅ Lists user's workspaces with role |
| `/api/workspaces` | POST | ✅ Creates workspace + owner member |
| `/api/workspaces/[id]` | PATCH | ✅ Update name/settings (admin+) |
| `/api/workspaces/[id]` | DELETE | ✅ Delete workspace (owner only) |
| `/api/workspaces/[id]/members` | GET | ✅ Lists members + pending invites, enriched with auth.users data via service role |
| `/api/workspaces/[id]/invitations` | POST | ✅ Send invite — seat limit check, upsert, Resend email |
| `/api/workspaces/[id]/members/[userId]` | PATCH | ✅ Change role (cannot self-change) |
| `/api/workspaces/[id]/members/[userId]` | DELETE | ✅ Remove member (self-removal allowed) |
| `/api/invitations/[token]/accept` | GET | ✅ Peek invite details |
| `/api/invitations/[token]/accept` | POST | ✅ Accept — email verify, insert member, mark accepted |

### Email Invitations
- `lib/email/invitation.ts` — **CREATED**
  - Resend API integration (`RESEND_API_KEY` env var)
  - Premium dark-theme HTML email with logo, invite badge, personal message slot, CTA button
  - 7-day expiry noted in email
  - Invite URL: `${APP_URL}/accept-invite/${token}`
  - Falls back gracefully if `RESEND_API_KEY` not set (invite still created, email logged as skipped)

### Workspace Switcher (Sidebar)
- `components/Sidebar.tsx` — **UPDATED**
  - `WorkspaceSwitcher` component below logo: shows name, plan badge, role
  - Dropdown lists all user's workspaces with active checkmark
  - "Create workspace" option at bottom → `/workspace/setup`
  - `currentRole` shown in user profile area (replaces hardcoded "Sales Rep")
  - "Coaching" nav link — conditionally shown for manager/admin/owner only

### Team Tab (Settings)
- `app/(dashboard)/settings/page.tsx` — **UPDATED**
  - New "Team" tab added to `TABS` array and `TabKey` type
  - `TeamTab` component with:
    - Workspace overview (name, plan, seats used/max)
    - Members list: avatar, name, email, role badge, ⋮ menu (change role / remove)
    - Pending invitations section
    - "+ Invite member" button → `InviteModal`
  - `InviteModal`: email input, role picker (all roles except owner), optional message, Send
  - All actions use `useWorkspace()` context

---

## PART 2 — ACTIVE CALL OVERLAY

### Enhancements to `components/active-call-overlay.tsx`
- **Notes persistence** — real `PATCH /api/calls/[id]/notes` with 800ms debounce
  - DB call ID looked up via Supabase on call start using `telnyx_call_id`
  - Bearer token attached from `supabase.auth.getSession()`
- **VM Drop button** — calls `POST /api/calls/drop-voicemail` with `call_control_id`
  - Shows "Dropped!" with green state after successful drop
  - Keyboard shortcut: `V`
  - Disabled after first drop
- **Coaching Request button** — calls `POST /api/coaching/request`
  - Shows "Requested" with violet state after notification sent
  - Keyboard shortcut: `C`
- **6-button 3×2 grid** replacing the old 4-button 2×2 layout
  - Mute / Hold / Notes / Keypad / VM Drop / Coach
- **Keyboard shortcuts** — `V` (VM drop), `C` (coach request) added

### Overlay Architecture (unchanged — verified functional)
- Draggable on desktop, position saved to `localStorage`
- Fixed bottom on mobile (no drag)
- Minimized pill: bottom-right, shows timer + name + expand/hang-up
- Auto-hides on `/dialer` route (redundant there)
- Document title pulses: `🔴 02:43 · Name — GrowthDialer`
- Keyboard shortcuts: `M` mute · `H` hold · `N` notes · `V` VM · `Esc` minimize

---

## PART 3 — CALL COACHING

### Migration Status
- `supabase/migrations/021_coaching.sql` — **CREATED** (manual run required after 020)
  - Table: `coaching_sessions` (call_id, agent_id, coach_id, workspace_id, mode, telnyx_conference_id, coach_call_control_id, started_at, ended_at, notes, rating, feedback)
  - Table: `coaching_metrics` (aggregated per agent per period)
  - View: `active_team_calls` — live calls enriched with agent + lead data
  - RLS policies, indexes

### API Routes — Coaching
| Route | Method | Status |
|-------|--------|--------|
| `/api/coaching/active-calls` | GET | ✅ Active calls in workspace (manager+), enriched with agent/lead info |
| `/api/coaching/sessions/start` | POST | ✅ Start session — permission check, create DB record |
| `/api/coaching/sessions/[id]/mode` | PATCH | ✅ Switch listen/whisper/barge mode |
| `/api/coaching/sessions/[id]/end` | POST | ✅ End session, save rating + feedback |
| `/api/coaching/request` | POST | ✅ Agent requests coach on active call |

### Coaching Live Dashboard — `/coaching/live`
- `app/(dashboard)/coaching/live/page.tsx` — **CREATED**
- Access: owner / admin / manager roles only (permission-gated, shows access error for others)
- **Call cards**: agent name, lead name/company, live elapsed timer, animated waveform
- **3 coaching buttons per card**: Listen · Whisper · Barge
  - Listen: blue — silent monitoring
  - Whisper: violet — coach speaks to agent only
  - Barge: amber — 3-way conference
- **Coaching panel** (right-side drawer): opens when coach joins a call
  - Shows agent name, call info, live timer, waveform
  - Mode switcher: toggle between listen/whisper/barge in real-time
  - Post-call: 5-star rating + feedback textarea
  - "End Coaching Session" — saves metadata, clears panel
- Auto-refreshes call list every 5 seconds (polling)
- "Coaching" link in sidebar — visible to managers+ only

### 3 Coaching Modes Architecture
| Mode | Who Hears Coach | Agent Notified | Lead Notified |
|------|----------------|----------------|---------------|
| Listen | Nobody | Yes (subtle pill) | No |
| Whisper | Agent only | Yes (prominent pill) | No |
| Barge | Everyone | Yes (red pill) | Yes |

*Note: Full Telnyx conference API integration requires `telnyx_conference_id` to be populated. The session records and mode switching are fully implemented. Telnyx conference room creation is the deployment-side integration step.*

---

## PART 4 — INTEGRATION POINTS

- `WorkspaceProvider` added to `app/(dashboard)/layout.tsx` — outermost provider, wraps all dashboard routes
- Sidebar: workspace switcher, dynamic role label, conditional coaching link
- Settings: Team tab with full member management
- Active Call Overlay: real notes persistence, VM drop, coaching request

---

## PART 5 — WHAT NEEDS MANUAL ACTION

1. **Run migration 020** in Supabase SQL editor (creates workspace tables, migrates existing data)
2. **Run migration 021** after 020 (creates coaching tables + view)
3. **Set env vars**:
   - `RESEND_API_KEY` — for invitation emails
   - `EMAIL_FROM` — sender address (defaults to `GrowthDialer <noreply@growthdialer.ai>`)
   - `APP_URL` — for invite link generation
4. **Telnyx conference integration** — for real whisper/barge audio routing, deploy Telnyx conference commands in `sessions/start/route.ts`

---

## PART 6 — TYPESCRIPT STATUS

```
npx tsc --noEmit → 0 errors
```

All files pass strict TypeScript checks.

---

## SECURITY

- All workspace queries filtered by `workspace_id` (RLS + application layer)
- Invitation tokens: `crypto.randomBytes(32)` = 256-bit entropy
- Role checks on every mutation endpoint (`hasPermission()`)
- Email mismatch check on invitation acceptance
- Service role client used only server-side for `auth.admin.listUsers()`
- Vendors (Telnyx, Supabase, Resend) never visible in UI

---

*Build completed: 2026-05-22*
