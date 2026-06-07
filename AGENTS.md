<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project context

Before large changes, read **`PROJECT_STATUS.md`** — what's shipped, what was fixed recently, and the prioritized build backlog for GrowthDialer.

## Vendor confidentiality

Never expose infrastructure vendors or internal APIs to end users (marketing copy, UI labels, toasts, or API error messages shown in the app). Use generic product language instead — e.g. "voice service", "billing portal", "call analysis". Partner integrations users connect to (HubSpot, Salesforce, Zapier) are fine to name. Internal code, logs, and admin-only routes may reference vendors.
