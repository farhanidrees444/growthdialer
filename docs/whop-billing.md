# GrowthDialer billing review

Updated October 30, 2026. The owner authorized a Vercel review deployment. Work remains on feat/whop-subscriptions; no production merge, live checkout publication, live product creation or real payment activation has been performed.

## Existing billing audit

The repository contains overlapping Stripe workspace plans, Polar user subscriptions and a default-off BILLING_ENABLED flag. The current pricing-page catalog is Starter/Growth/Pro at $49/$79/$119 per seat monthly; annual invoices are $468/$756/$1,140 per seat. Older marketing and workspace plan definitions still differ. This integration uses the current pricing-page catalog for Whop and routes Settings billing to the same user subscription record. Legacy checkout and webhook entry points are blocked when BILLING_PROVIDER=whop to prevent conflicting writes. Existing paid accounts require reconciliation before switching providers.

## Implemented

- Branded two-column purchase review and embedded checkout with monthly/annual invoice totals, seat quantity, renewal disclosure, tax and usage notices, recovery messages and billing management.
- Server-side authentication, origin checks, bounded seat validation, fixed server pricing, limited checkout creation frequency, persisted checkout intents, provider idempotency keys and user-owned checkout page access.
- Server-generated checkout metadata contains an opaque intent ID. Browser-supplied plan, amount or success query parameters cannot activate access.
- Raw webhook signature verification uses the official SDK helper. Membership state is retrieved from the provider and checked against business, product, intent and purchased variant before persistence.
- Database transaction handles event deduplication, retries, ownership, row locking, membership update ordering and replacement of canceled subscriptions. Failure rolls back the event receipt too.
- Calling authorization and client feature gating use subscription state and expiry. Sandbox/live subscription state is isolated. Canceled, expired, unknown and overdue states do not grant access. End-of-period cancellation keeps access only through the recorded period end.
- Customer billing management retrieves the authenticated user's membership portal URL from the provider and validates its host.
- Separate live-payment approval flag; defaults to sandbox. Disabled webhooks return a retryable error, not a false acknowledgement.
- Automatic Vercel PREVIEW deployment is enabled for feat/whop-subscriptions after the owner requested a review URL. Production remains on main. Branch-specific preview variables keep BILLING_ENABLED=false, BILLING_PROVIDER=whop, WHOP_SANDBOX=true and WHOP_LIVE_PAYMENTS_APPROVED=false.

## Sandbox account and products

Account: biz_grbNEyRgxZKzXj (separate from the live biz_QkHaYBWEOHZ6dD account).

| Product | Sandbox product ID | Monthly, per seat |
| --- | --- | --- |
| Starter | prod_yTonwfURiB9rb | $49 |
| Growth | prod_UvFcvW9mTBh0w | $79 |
| Pro | prod_wLVQjDZH26bPf | $119 |

All three are hidden. No live checkout links are published. The checkout API creates hidden seat-priced recurring variants for monthly or annual billing from the shared catalog. It never accepts a price from the browser. No free trial is configured for paid checkout.

A sandbox key creation form is prepared but NOT submitted. Name: GrowthDialer sandbox integration. Expires November 6, 2026 at 00:00 UTC (05:00 Pakistan time). Six scopes selected: checkout_configuration:basic:read, checkout_configuration:create, plan:basic:read, plan:create, member:basic:read, member:manage. The in-app renewal controls and payment history additionally require membership:update and payment:basic:read; these are NOT yet granted. No payment-creation, payout, transfer, membership-creation or administrative scopes are needed. Credential creation remains unsubmitted and requires browser action-time confirmation. The API client explicitly pins requests to 2026-09-25.

## Validation

- TypeScript typecheck passed against the repository's locked Next.js/react-icons/Stripe versions.
- Production Next.js build completed successfully using non-secret placeholder Supabase variables; this checks compilation and prerendering, not a real database connection.
- Four automated billing tests cover server pricing and tampered selections; membership access/expiry; real Standard Webhooks HMAC validation including forgery/stale timestamps; and the SQL migration's transaction lifecycle on a local PostgreSQL engine (PGlite).
- The database test covers failed-write rollback and successful retry, duplicate delivery, late event ordering, overdue/recovery/cancellation, consumed checkout intent rejection, superseded membership events and denial of RPC execution to authenticated clients.
- Checkout production HTML was rendered and checked for the chosen plan, three-seat $237 monthly total and payment action. A temporary test route was removed before the final commit.
- Focused lint runs on the new checkout, webhook, catalog and billing panel files.

## Remaining work: not yet verified end to end

1. Confirm creation of the scoped sandbox key, then store it only in local or test-server environment secrets. Never put credentials in this repository or in browser-exposed variables.
2. Supply an isolated Supabase test project's URL, anon key and service-role key through secure environment configuration. Apply the existing subscription migration followed by 20261030_whop_billing.sql to that test project. After the owner connected Supabase and requested launch preparation, the additive billing migration was applied to the existing project qnknfgbwcqchmhxobbnx. The subscription table was empty. Verification confirmed zero billing records, RLS, no anon/authenticated activation permission, service-role-only activation, and SECURITY INVOKER. Calls/leads/recordings and existing access were not changed.
3. Configure a reachable TEST webhook receiver at /api/webhooks/whop, pinned to 2026-09-25, subscribed to membership.activated, membership.deactivated and membership.updated. Store its signing secret verbatim as WHOP_WEBHOOK_SECRET. A Vercel preview is authorized; no Whop webhook destination has been created yet.
4. Test a signed-in test customer's selection, checkout, sandbox payment, webhook delivery, activation, access checks, receipt, billing portal, cancellation, failed renewal and recovery. Test a second user's attempted checkout/portal access, duplicate and out-of-order webhooks, decline and abandoned checkout. A provider sandbox purchase and full browser journey have NOT yet been executed.
5. Verify desktop/mobile layouts visually and all actual payment options in the connected test deployment. The new /billing-preview route is an explicitly labeled interactive design demo, unavailable in Vercel production. It never calls billing or telephony APIs. Hosted payment branding must remain consistent with the application.
6. Confirm the product's outbound calling use case and Pakistan individual payout setup are approved by Whop before launch. This turn did not claim merchant or payout approval.
7. Only after explicit launch approval: configure live products/secrets, apply reviewed production migration, reconcile existing subscriptions, set BILLING_PROVIDER=whop and BILLING_ENABLED=true, WHOP_SANDBOX=false, and WHOP_LIVE_PAYMENTS_APPROVED=true; then approve deployment separately. Preserve rollback access to old subscriptions. Never reuse sandbox subscription rows in production.

## Local commands

Use Node 24 (or a version supporting TypeScript stripping) for billing tests.

```sh
npm run test:billing
npx tsc --noEmit
npm run build
```

For sandbox catalog maintenance, the optional setup script refuses live mode:

```sh
WHOP_SANDBOX=true npm run billing:setup-sandbox
```

The script needs product read/create permissions beyond the runtime key; the three products above were already created in the browser, so running it is unnecessary for this handoff. Do not widen the runtime key for maintenance.

## Sources used

- https://whop.com/blog/add-checkout-to-nextjs-app/
- https://docs.whop.com/developer/guides/webhooks
- Official @whop/sdk 2.4.0 generated API types and webhook helper implementation.
- https://vercel.com/docs/project-configuration/git-configuration


## In-product billing workspace

- /billing is part of the authenticated product shell, with desktop and mobile navigation entries. The same UI is embedded in Settings → Billing when billing is enabled.
- Customers can choose cycle/seats and complete checkout in an embedded dialog. Completion stays in the product and polls the exact checkout intent; it never unlocks on a client callback alone.
- Current plan, recorded renewal amount, cycle, seats, period-end cancellation and resuming automatic renewal are handled inside the product.
- Payment history and user-owned payment receipts are loaded from authenticated provider responses. Raw card data is never returned. Updating payment methods uses the secure hosted management page; that function is not represented as an in-product card editor.
- Plan/seat changes for an existing subscription explicitly route to support, avoiding a second overlapping subscription. Automatic proration or self-service tier switching is not implemented.
- Disabled billing returns its bypass state before querying new database columns. Existing calling access remains open while billing is off. The preview route uses sample subscription details and cannot activate access.
- The current pricing page now has a single hero, coherent seat/annual totals, no unsupported paid-trial promise, and original generated acoustic-ribbon artwork.

## Existing advisory findings

The Supabase advisor had pre-existing warnings about mutable function search paths, workspace SECURITY DEFINER helper exposure, and leaked-password protection. They are outside this billing change and were not automatically altered because doing so could affect existing app authorization. The only new advisor informational finding is expected for whop_processed_events: RLS is enabled with no client policy because the table is service-only.

## Generated visual asset

Built-in image generation created public/billing/conversation-sculpture.webp (1672×941, approximately 74 KB). The source is an original graphite/frosted-glass acoustic ribbon with restrained cyan rim lighting, with no text, logos, people, UI or charts. It appears on the public pricing page and the in-product plan card. See docs/billing-artwork.md for the generation specification.
