# GrowthDialer — Launch Principles (until GA)

Keep these constraints on every feature, page, and copy change until successful launch.

## Product truth

- Show what ships today. Mark roadmap items honestly (waitlist / coming soon).
- HubSpot is live; parallel dial, power dial, recordings, AI analysis are real — lead with them.
- Never claim coaching audio bridge or live AI coach until Telnyx bridge ships.

## UX & design

- **Premium, not template:** Smartlead-level motion (framer-motion, Lottie sparingly), glass surfaces, design tokens — not raw `#8B5CF6` hex in new code.
- **shadcn/ui first:** Dialog, Sheet, Tabs, AlertDialog — not `window.confirm` or custom modals.
- **Call visibility:** Users must always find calls via **Call Logs**, **Recordings**, and **Inbound settings** history.
- **Not AI-slop copy:** Short, specific sentences. Name real behaviors ("first connect wins", "AMD skip") — avoid filler adjectives.

## SEO & LLM

- Every dashboard route: `layout.tsx` or `metadata` with clear `title` + `description`.
- Marketing pages: canonical URLs, structured headings (one H1), factual feature lists.
- FAQ and pricing aligned with `lib/marketing/pricing.ts` — single source of truth.

## Marketing = product

- Homepage and `/features/integrations` use **real integration logos** (`react-icons/si`), not generic placeholders.
- Screenshots and sections should mirror actual app surfaces (dialer, call logs, leaderboard).
- Marquee / grid: badge **Live** only for integrations that work in production.

## Engineering

- Workspace-scoped APIs, RLS-safe queries, `ownCallsOrFilter` for call data.
- Build must pass before push to `main`.
- Migrations documented; user runs Supabase migrations for new schema.

## Sidebar information architecture

```
Dashboard → Dialer → Leads → Sequences → Analytics
→ Call Logs → Inbound (settings) → Leaderboard → Recordings → Numbers → Integrations → Coaching
```
