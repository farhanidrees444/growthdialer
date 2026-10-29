# GrowthDialer billing review

Prepared October 30, 2026. No deployment, live checkout publication, live product creation or real payment was authorized or performed.

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
- Automatic Vercel deployment is disabled specifically for feat/whop-subscriptions in vercel.json.

## Sandbox account and products

Account: biz_grbNEyRgxZKzXj (separate from the live biz_QkHaYBWEOHZ6dD account).

| Product | Sandbox product ID | Monthly, per seat |
| --- | --- | --- |
| Starter | prod_yTonwfURiB9rb | $49 |
| Growth | prod_UvFcvW9mTBh0w | $79 |
| Pro | prod_wLVQjDZH26bPf | $119 |

All three are hidden. No live checkout links are published. The checkout API creates hidden seat-priced recurring variants for monthly or annual billing from the shared catalog. It never accepts a price from the browser. No free trial is configured for paid checkout.

A sandbox key creation form is prepared but NOT submitted. Name: GrowthDialer sandbox integration. Expires November 6, 2026 at 00:00 UTC (05:00 Pakistan time). Six scopes selected: checkout_configuration:basic:read, checkout_configuration:create, plan:basic:read, plan:create, member:basic:read, member:manage. No payment, payout, transfer, membership-creation or administrative scopes are selected. Browser security rules require action-time confirmation before creating this credential. The API client explicitly pins requests to 2026-09-25.

## Validation

- TypeScript typecheck passed against the repository's locked Next.js/react-icons/Stripe versions.
- Production Next.js build completed successfully using non-secret placeholder Supabase variables; this checks compilation and prerendering, not a real database connection.
- Four automated billing tests cover server pricing and tampered selections; membership access/expiry; real Standard Webhooks HMAC validation including forgery/stale timestamps; and the SQL migration's transaction lifecycle on a local PostgreSQL engine (PGlite).
- The database test covers failed-write rollback and successful retry, duplicate delivery, late event ordering, overdue/recovery/cancellation, consumed checkout intent rejection, superseded membership events and denial of RPC execution to authenticated clients.
- Checkout production HTML was rendered and checked for the chosen plan, three-seat $237 monthly total and payment action. A temporary test route was removed before the final commit.
- Focused lint runs on the new checkout, webhook, catalog and billing panel files.

## Remaining work: not yet verified end to end

1. Confirm creation of the scoped sandbox key, then store it only in local or test-server environment secrets. Never put credentials in this repository or in browser-exposed variables.
2. Supply an isolated Supabase test project's URL, anon key and service-role key through secure environment configuration. Apply the existing subscription migration followed by 20261030_whop_billing.sql to that test project. No production migrations have been run.
3. Configure a reachable TEST webhook receiver at /api/webhooks/whop, pinned to 2026-09-25, subscribed to membership.activated, membership.deactivated and membership.updated. Store its signing secret verbatim as WHOP_WEBHOOK_SECRET. No deployment or webhook destination is created in this turn.
4. Test a signed-in test customer's selection, checkout, sandbox payment, webhook delivery, activation, access checks, receipt, billing portal, cancellation, failed renewal and recovery. Test a second user's attempted checkout/portal access, duplicate and out-of-order webhooks, decline and abandoned checkout. A provider sandbox purchase and full browser journey have NOT yet been executed.
5. Verify desktop/mobile layouts visually and all actual payment options in the connected test deployment. Hosted payment branding must remain consistent with the application.
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
