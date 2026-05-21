# Phase 3 & 4 Implementation Report

## Phase 3: Active Call Overlay

### What Was Built

**Enhanced `components/active-call-overlay.tsx`** — Complete rewrite with:

- **Route-aware**: Returns `null` automatically when `pathname` starts with `/dialer` (no redundant overlay while on dialer page)
- **Browser tab title**: Updates `document.title` to `🔴 02:43 · Lead Name — GrowthDialer` while on a call (alternating dot flash). Restores original on call end
- **Draggable card**: Uses framer-motion `drag` with `useMotionValue` — positioned at center of screen by default, draggable on desktop. Drag position persists in `localStorage` key `gd-call-overlay-pos`
- **Mobile**: No drag on mobile (`< 768px`). Fixed bottom positioning, slide animations only
- **Animated waveform**: 28-bar gradient animation (`cyan → violet`) that pulses when call is active, idles when on hold/ended
- **3 states**: Full card (draggable) → Minimized pill (bottom-right) → Returns to full on click
- **Connection quality**: Visual quality indicator (WiFi icon + dot) in header
- **Updated keyboard shortcuts**: `Esc` = minimize (not end call), `M` = mute, `H` = hold, `N` = focus notes
- **Accessibility**: `aria-label`, `aria-pressed`, `aria-live` on overlay container

### Architecture
The overlay is already mounted in `app/(dashboard)/layout.tsx` inside `DashboardOverlays`, so it persists across all dashboard page navigations automatically. Call state lives in `WebPhoneProvider` + `CallProvider` (React Context) — no Zustand needed.

### Integration Points
| Event | Behavior |
|-------|----------|
| Call starts (`connecting`) | Overlay appears, animates in |
| Navigate to another page | Overlay stays (Context is root-level) |
| Navigate to `/dialer` | Overlay hides (pathname check) |
| Call ends | Overlay fades out, title restored |
| Click minimize `[−]` | Shrinks to pill |
| Click expand on pill | Returns to full card |

---

## Phase 4: Leads Page — Premium Polish

### New Files Created

#### API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/leads` | `POST` | Create lead manually (with duplicate phone detection) |
| `/api/leads/bulk` | `POST` | Bulk actions: delete, restore, status, mark_hot, mark_dnc, tag_add, tag_remove |
| `/api/leads/[id]/activity` | `GET` | Activity timeline (calls + activities table) |
| `/api/leads/export` | `POST` | CSV/JSON export with field selection |
| `/api/lead-tags` | `GET, POST` | List and create user tags |
| `/api/lead-tags/[id]` | `DELETE, PATCH` | Delete or rename a tag |

#### Pages
| File | Description |
|------|-------------|
| `app/(dashboard)/leads/[id]/page.tsx` | Full lead detail page |

#### Components
| File | Description |
|------|-------------|
| `components/leads/lead-add-modal.tsx` | Add lead modal with validation + duplicate detection |
| `components/leads/lead-edit-modal.tsx` | Edit lead modal (full form, pre-filled) |
| `components/leads/bulk-action-bar.tsx` | Floating bulk action bar (mark hot, DNC, export, delete) |
| `components/leads/lead-filter-drawer.tsx` | Right-side filter drawer (status, source, last contact, attributes, attempts) |
| `components/leads/lead-export-modal.tsx` | Export modal (format, scope, field selection) |
| `components/leads/lead-table-view.tsx` | Dense table view with checkboxes, inline 3-dot menu |
| `components/leads/view-toggle.tsx` | Grid/Table view toggle button |

#### Database Migrations (run manually)
| File | Description |
|------|-------------|
| `supabase/migrations/016_lead_tags.sql` | `lead_tags` + `lead_tag_assignments` tables with RLS |
| `supabase/migrations/017_lead_soft_delete.sql` | `deleted_at` + `deleted_by` columns on `leads` table |

### Leads Page Features Added

#### Lead Card (`leads/page.tsx`)
- ✅ Checkbox top-left (visible on hover, always shown when selected)
- ✅ 3-dot menu top-right (Call / View / Edit / Delete)
- ✅ Tags displayed (max 2 + "+N more")
- ✅ Hover lift animation
- ✅ Click anywhere → `/leads/[id]` detail page
- ✅ Card highlights when selected

#### Lead Detail Page (`/leads/[id]`)
- ✅ Left panel: avatar, inline-editable fields (click to edit, Enter saves, Esc cancels)
- ✅ Status selector
- ✅ Tags display
- ✅ Quick stats grid (total calls, last contact, AI score, status)
- ✅ Right panel: activity timeline with call events, recordings, notes
- ✅ Notes: existing notes + add new note form
- ✅ Delete with confirmation modal (soft delete)
- ✅ Call Now button in header
- ✅ Mobile: single column stacked layout

#### Add Lead
- ✅ "+ Add Lead" button in toolbar (top right)
- ✅ Modal form: first/last name, company, title, phone (required), email, notes
- ✅ Real-time field validation
- ✅ Duplicate phone detection (warning if phone exists)
- ✅ On success: new lead prepended to list (no refresh)

#### Edit Lead
- ✅ Via 3-dot menu on card → "Edit"
- ✅ Via 3-dot menu in table view
- ✅ Modal pre-filled with current values
- ✅ Save via PATCH `/api/leads/[id]`

#### Delete Lead
- ✅ Confirmation modal with soft delete message
- ✅ Soft delete: sets `deleted_at` (requires migration 017)
- ✅ Fallback to hard delete if migration not yet applied
- ✅ Lead visually removed from list immediately (optimistic update)
- ✅ Toast with description about 30-day recovery

#### Bulk Actions
- ✅ Checkbox on every card (grid + table view)
- ✅ Floating action bar appears when 1+ selected
- ✅ Actions: Mark Hot, Mark DNC, Export, Delete
- ✅ Delete confirmation with count
- ✅ Optimistic UI updates
- ✅ Clear selection button (×)
- ✅ "Select all on page" link in grid view

#### View Toggle
- ✅ Grid view (default, visual cards)
- ✅ Table view (dense rows with all columns)
- ✅ Toggle persists within session

#### Advanced Filters (Filter Drawer)
- ✅ Filter by: status (multi-select), source, last contacted, has email, has notes, call attempts range
- ✅ Filter chips shown in toolbar with individual dismiss buttons
- ✅ "Clear all" link
- ✅ Filter badge count on Filter button

#### Trash Tab
- ✅ Separate "Trash" tab showing soft-deleted leads
- ✅ Restore action replaces Delete in trash view
- ✅ Requires migration 017 to function fully

#### Export
- ✅ Export button in toolbar
- ✅ Modal: format (CSV/JSON), scope (all/selected/filtered), field selection
- ✅ Downloads file directly via browser

---

## Dependencies
No new npm packages needed. All features use existing:
- `framer-motion` (already installed)
- `sonner` (toast, already installed)
- `lucide-react` (icons, already installed)
- Next.js 16 App Router patterns

---

## Migrations: Run These Manually

```bash
# In Supabase dashboard → SQL Editor, run:
# 1. supabase/migrations/016_lead_tags.sql
# 2. supabase/migrations/017_lead_soft_delete.sql
```

**Without migration 017**: Delete falls back to hard delete. Trash tab will be empty.  
**Without migration 016**: Tags API returns empty array gracefully. Tags features degrade silently.

---

## Manual Test Checklist (35 items)

### Phase 3 — Active Call Overlay
- [ ] Start a call from Leads page → overlay appears
- [ ] Navigate to Dashboard while on call → overlay stays visible
- [ ] Navigate to /dialer while on call → overlay hides
- [ ] Navigate back from /dialer → overlay reappears
- [ ] Click minimize [−] → shrinks to pill (bottom-right)
- [ ] Click expand on pill → returns to full card
- [ ] Browser tab title shows "🔴 00:05 · Lead Name" during call
- [ ] Tab title restores to "GrowthDialer" after call ends
- [ ] Drag overlay to new position → reload page → overlay restores to that position
- [ ] Press Esc → overlay minimizes (does NOT end call)
- [ ] Press M → mute toggles
- [ ] Press H → hold toggles
- [ ] Press N → notes textarea focuses
- [ ] Waveform animates during active call, stills on hold
- [ ] Quality dot shows in header during active call
- [ ] On mobile (< 768px): overlay uses bottom fixed position, no drag
- [ ] End call → overlay animates out
- [ ] DTMF keypad opens correctly from keypad button

### Phase 4 — Leads Page
- [ ] "+ Add Lead" button opens add modal
- [ ] Add modal: first/last name + phone required, save creates lead and prepends to list
- [ ] Add modal: entering duplicate phone shows warning (not error)
- [ ] 3-dot menu on card shows Call / View / Edit / Delete
- [ ] Edit via 3-dot → modal opens pre-filled → save updates card in place
- [ ] Delete via 3-dot → confirmation modal → lead disappears from list
- [ ] Click anywhere on card (not buttons) → navigates to /leads/[id]
- [ ] Lead detail page loads with correct lead data
- [ ] Inline field edit on detail page: click → input → Enter → saves
- [ ] Inline field edit: Esc cancels without saving
- [ ] Activity timeline shows calls
- [ ] Notes can be added from detail page
- [ ] Call Now button on detail page initiates call
- [ ] Checkbox on card: hover shows it, click selects
- [ ] Select 2+ leads → bulk action bar appears at bottom
- [ ] Bulk mark hot → tags updated
- [ ] Bulk delete → confirmation → leads disappear from list
- [ ] View toggle: switch to table view → table renders correctly
- [ ] Table view checkboxes work, select all works
- [ ] Filter drawer: select status filters → apply → leads filtered
- [ ] Filter chips appear in toolbar, × removes individual filter
- [ ] Export modal → CSV → file downloads
- [ ] Trash tab shows soft-deleted leads (requires migration 017)
- [ ] Restore from Trash tab works

---

## Known Limitations

1. **Tags system** (migration 016) is partially implemented. The `tags` field on leads is a `text[]` array column — the new `lead_tags` table enables structured colored tags but the UI for managing colors is in `/settings → Tags` (not yet built; flagged for next phase).

2. **Drag bounds**: On window resize while dragging, the constraints update on next drag. No live recalculation needed for typical usage.

3. **Activity timeline** gracefully handles missing `activities` table (pre-migration 003). Returns call history only.

4. **Kanban view** not implemented (deferred — requires drag-and-drop lib and significant layout work).

5. **Import wizard improvements** deferred — existing import works well and full multi-step wizard is a separate feature track.

6. **AI Insights panel** on lead detail page is a placeholder — requires call recordings and AI processing pipeline to be fully active.
