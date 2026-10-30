# GrowthDialer billing

## Release state

The owner approved live billing and main-domain release, created the production API key in Chrome, and deferred the real-card purchase to their own later test. No card payment has been submitted by the agent. Production credentials are now stored as Vercel server-only secrets. Purchasing remains disabled until the release build is ready; activation and a successful customer payment must be recorded separately.

## Live catalog and connection

Live company: biz_QkHaYBWEOHZ6dD. These products were created in the connected Chrome session during this implementation, hidden from the store, with no free trial or affiliate rate:

| Plan | Product | Monthly per seat | Annual per seat |
| --- | --- | --- | --- |
| Starter | prod_wB2AJJUaTEaDm | $49 | $468 |
| Growth | prod_9iu21FlbKHni1 | $79 | $756 |
| Pro | prod_yXGqEetlbm8Ll | $119 | $1,140 |

The application creates unique hidden variants from server-side prices for 1–500 seats, using one unit of stock and an idempotency key. A single unfinished checkout per user/environment must be resumed before a different selection can be purchased. Existing free Website products were left unchanged. No public hosted checkout link was published.

The owner-created key, GrowthDialer production billing, expires October 30, 2027 at 00:00 UTC. Runtime scopes: checkout_configuration:basic:read, checkout_configuration:create, plan:basic:read, plan:create, member:basic:read, member:manage, membership:update, payment:basic:read. It has no direct-charge, payout, transfer, membership-creation or administrative scope. The SDK pins API requests to 2026-09-25.

Live webhook hook_akhFBLbBHtFnm is active at https://app.growthdialer.com/api/webhooks/whop for membership.activated, membership.deactivated, membership.updated and membership.cancel_at_period_end_changed. The editor offered current date versions; 2026-10-29-8 was selected, while its summary labels the schema v1. The handler verifies the signed envelope and retrieves authoritative membership through the pinned API rather than trusting event payload status. The signing secret is stored verbatim in Vercel production secrets. A successful provider delivery is not yet claimed.

Production configuration uses BILLING_PROVIDER=whop, WHOP_SANDBOX=false, WHOP_LIVE_PAYMENTS_APPROVED=true and WHOP_SANDBOX_WEBHOOK_ENABLED=false. BILLING_ENABLED is the final purchasing/access switch and requires a new deployment to take effect. Never copy production credentials into preview environments. The existing branch preview retains sandbox configuration.

## Access and subscription security

- Raw client completion never grants access. The application verifies a canonical provider membership against a user-owned checkout intent, account, product, price, environment and metadata.
- The service-only SECURITY INVOKER activation transaction records events and entitlements atomically, supports retries and duplicate/out-of-order delivery, and serializes checkout reservation and activation using the same lock order.
- RLS allows customers to read their own checkout intents. Anonymous and authenticated roles cannot execute activation or reservation RPCs. Processed events are service-only.
- BILLING_ACCESS_GRANDFATHERED_BEFORE preserves confirmed pre-rollout accounts until they begin a subscription in the current provider environment. Strict UTC parsing rejects malformed calendar dates. A matching provider subscription always follows its actual status and expiry. The calling routes pass their already-authenticated user into the gate.
- Production and sandbox subscriptions are never interchangeable. Existing calling access stays open while BILLING_ENABLED=false.
- Legacy Stripe/Polar checkout is blocked in Whop mode; their validated webhooks acknowledge without conflicting entitlement writes.

## In-product experience and visual design

/billing and Settings → Billing share the authenticated product workspace. Customers can select seats/cycle, purchase with embedded Whop Elements 1.9.0, see subscription details, cancel or resume automatic renewal, and review owned payment history/receipts. Updating a payment method uses the secure provider portal. Tier/seat changes on an existing subscription route to support; automatic proration is not implemented.

Billing uses GrowthDialer's zinc surfaces and violet accent, including checkout controls. The original optimized acoustic-ribbon image in public/billing/conversation-sculpture.webp is tinted violet at render time without adding another image download. Light and dark layouts retain the existing app shell. /billing-preview is a labeled sample-data demonstration and is unavailable in Vercel production.

## Completed validation

- Six automated billing tests cover server pricing and malformed selections, membership expiry/access, real Standard Webhooks HMAC validation, transaction rollback/retry/deduplication/order, owned auth continuation and confirmed-account rollout access including malformed calendar dates.
- The database lifecycle fixture applies the four migrations in deployment timestamp order and verifies service-only RPC execution. Filenames match the connected database history: 20261029235135, 20261030001925, 20261030002317 and 20261030192127. No migration was reapplied or history rewritten during filename alignment.
- The additive schema and consistent lock order were applied and verified in qnknfgbwcqchmhxobbnx. Existing calls/leads/recordings were not changed. The system health check uses the same non-empty secret fallback as the service client.
- TypeScript checking and focused lint passed before the final style revision; rerun them for the release commit. Earlier Vercel previews compiled successfully. A recent local build failed downloading Google Fonts, which is an environment limitation rather than a successful production build.
- Prior connected-Chrome checks covered desktop/mobile layouts, correct three-seat annual totals, signed-out billing protection, authenticated sandbox selection, reservation conflicts and resuming the correct hosted test form. No payment was submitted.

## Remaining customer verification

The owner will test a real-card purchase later. Until then, successful payment, signed provider delivery, activation, payment history, cancellation, failed-renewal recovery and end-to-end paid calling access are not verified. The outbound calling use case and Pakistan individual payout eligibility have not been independently confirmed with the provider; no merchant approval is claimed here.

Existing global hydration/data-fetch issues and pre-existing Supabase advisor warnings (mutable function search paths, workspace helper exposure and leaked-password protection) were not changed as part of billing. Existing production monitoring configuration is retained.

## Commands and references

Run npm run test:billing and npx tsc --noEmit. Production builds run in Vercel. The optional billing:setup-sandbox script refuses live mode and is unnecessary for the already-created catalog.

- https://docs.whop.com/developer/guides/embed-checkout.md
- https://docs.whop.com/developer/guides/webhooks
- https://docs.whop.com/api-reference/beta/memberships/retrieve-membership.md
- Official @whop/sdk 2.4.0 generated API types and webhook helper implementation
- https://vercel.com/docs/deployments
