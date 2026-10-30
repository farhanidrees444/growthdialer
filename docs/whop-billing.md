# GrowthDialer billing review

Updated October 30, 2026. The owner authorized the Vercel review deployment and subsequently requested release to the main domain. Work remains on feat/whop-subscriptions; no production merge, live checkout publication, live product creation or real payment activation has been performed.

## Existing billing audit

The repository contains overlapping Stripe workspace plans, Polar user subscriptions and a default-off BILLING_ENABLED flag. The current pricing-page catalog is Starter/Growth/Pro at $49/$79/$119 per seat monthly; annual invoices are $468/$756/$1,140 per seat. Older marketing and workspace plan definitions still differ. This integration uses the current pricing-page catalog for Whop and routes Settings billing to the same user subscription record. Legacy checkout and webhook entry points are blocked when BILLING_PROVIDER=whop to prevent conflicting writes. Existing paid accounts require reconciliation before switching providers.

## Implemented

- Branded two-column purchase review and production Elements checkout with monthly/annual invoice totals, seat quantity, renewal disclosure, tax and usage notices, recovery messages and billing management.
- Server-side authentication, origin checks, bounded seat validation, fixed server pricing, limited checkout creation frequency, persisted checkout intents, provider idempotency keys and user-owned checkout page access.
- Server-generated checkout metadata contains an opaque intent ID. Browser-supplied plan, amount or success query parameters cannot activate access.
- Raw webhook signature verification uses the official SDK helper. Membership state is retrieved from the provider and checked against business, product, intent and purchased variant before persistence.
- Database transaction handles event deduplication, retries, ownership, row locking, membership update ordering and replacement of canceled subscriptions. Failure rolls back the event receipt too.
- Calling authorization and client feature gating use subscription state and expiry. Sandbox/live subscription state is isolated. Canceled, expired, unknown and overdue states do not grant access. End-of-period cancellation keeps access only through the recorded period end.
- Customer billing management retrieves the authenticated user's membership portal URL from the provider and validates its host.
- Separate live-payment approval flag; defaults to sandbox. Disabled webhooks return a retryable error, not a false acknowledgement.
- Automatic Vercel PREVIEW deployment is enabled for feat/whop-subscriptions after the owner requested a review URL. Production remains on main. Branch-specific preview variables initially kept BILLING_ENABLED=false and were subsequently enabled only for sandbox validation; production keeps BILLING_ENABLED=false. Other preview safety flags are, BILLING_PROVIDER=whop, WHOP_SANDBOX=true and WHOP_LIVE_PAYMENTS_APPROVED=false.

## Sandbox account and products

Account: biz_grbNEyRgxZKzXj (separate from the live biz_QkHaYBWEOHZ6dD account).

| Product | Sandbox product ID | Monthly, per seat |
| --- | --- | --- |
| Starter | prod_yTonwfURiB9rb | $49 |
| Growth | prod_UvFcvW9mTBh0w | $79 |
| Pro | prod_wLVQjDZH26bPf | $119 |

All three are hidden. No live checkout links are published. The checkout API creates hidden seat-priced recurring variants for monthly or annual billing from the shared catalog. It never accepts a price from the browser. No free trial is configured for paid checkout.

The scoped sandbox key was created with owner approval and stored as a server-only Vercel Preview Secret on feat/whop-subscriptions. Name: GrowthDialer sandbox integration. Expiration was verified in the dashboard as November 6, 2026 (seven days after creation). Eight scopes: checkout_configuration:basic:read, checkout_configuration:create, plan:basic:read, plan:create, member:basic:read, member:manage, membership:update and payment:basic:read. No payment-creation, payout, transfer, membership-creation or administrative scopes were granted. The API client explicitly pins requests to 2026-09-25.

Sandbox webhook hook_43P1dCbodX2nI targets https://app.growthdialer.com/api/webhooks/whop for membership.activated, membership.deactivated, membership.updated and membership.cancel_at_period_end_changed. Its signing secret is stored as a server-only Secret in both the branch preview and production receiver environments. The dashboard labels the webhook schema V1; its editor exposes no date-version setting. Production has sandbox-only credentials and WHOP_SANDBOX_WEBHOOK_ENABLED=true for this signed test receiver. BILLING_ENABLED=false still disables production checkout and preserves existing access. The sandbox-only webhook exception never accepts live-mode events while billing is off. No successful delivery is claimed.

## Validation

- Database preparation completed: after the owner connected Supabase and requested launch preparation, the additive billing migration was applied to the existing project qnknfgbwcqchmhxobbnx. The subscription table was empty. Verification confirmed zero billing records, RLS, no anon/authenticated activation permission, service-role-only activation, and SECURITY INVOKER. Calls/leads/recordings and existing access were not changed.

- TypeScript typecheck passed against the repository's locked Next.js/react-icons/Stripe versions.
- Production Next.js build completed successfully using non-secret placeholder Supabase variables; this checks compilation and prerendering, not a real database connection.
- Four automated billing tests cover server pricing and tampered selections; membership access/expiry; real Standard Webhooks HMAC validation including forgery/stale timestamps; and the SQL migration's transaction lifecycle on a local PostgreSQL engine (PGlite).
- The database test covers failed-write rollback and successful retry, duplicate delivery, late event ordering, overdue/recovery/cancellation, consumed checkout intent rejection, superseded membership events and denial of RPC execution to authenticated clients.
- Checkout production HTML was rendered and checked for the chosen plan, three-seat $237 monthly total and payment action. A temporary test route was removed before the final commit.
- Focused lint runs on the new checkout, webhook, catalog and billing panel files.

## Remaining work: not yet verified end to end

1. Complete a reachable sandbox receiver configuration and verify a signed provider delivery. The saved main-domain receiver can accept signed sandbox events independently of purchasing once its code is deployed; verify that delivery before claiming activation. Do not disable protection or expose bypass secrets in checkout links.
2. Test a signed-in test customer's selection, checkout, sandbox payment, webhook delivery, activation, access checks, receipt, billing portal, cancellation, failed renewal and recovery. Test a second user's attempted checkout/portal access, duplicate and out-of-order webhooks, decline and abandoned checkout. A provider sandbox purchase and full browser journey have NOT yet been executed.
3. Desktop/mobile design checks completed in connected Chrome; actual provider payment options still require credentials. The new /billing-preview route is an explicitly labeled interactive design demo, unavailable in Vercel production. It never calls billing or telephony APIs. Hosted payment branding must remain consistent with the application.
4. Confirm the product's outbound calling use case and Pakistan individual payout setup are approved by Whop before launch. This turn did not claim merchant or payout approval.
5. Only after explicit launch approval: configure live products/secrets, verify the already-applied migration and reconcile existing subscriptions, set BILLING_PROVIDER=whop and BILLING_ENABLED=true, WHOP_SANDBOX=false, and WHOP_LIVE_PAYMENTS_APPROVED=true; then approve deployment separately. Preserve rollback access to old subscriptions. Never reuse sandbox subscription rows in production.

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
- Customers can choose cycle/seats and complete live checkout in an embedded dialog using @whop/elements and @whop/elements-react 1.9.0. Sandbox purchases use the provider-hosted test page because Elements sandbox support is not available yet. Completion stays in the product and polls the exact checkout intent; it never unlocks on a client callback alone.
- Current plan, recorded renewal amount, cycle, seats, period-end cancellation and resuming automatic renewal are handled inside the product.
- Payment history and user-owned payment receipts are loaded from authenticated provider responses. Raw card data is never returned. Updating payment methods uses the secure hosted management page; that function is not represented as an in-product card editor.
- Plan/seat changes for an existing subscription explicitly route to support, avoiding a second overlapping subscription. Automatic proration or self-service tier switching is not implemented.
- Disabled billing returns its bypass state before querying new database columns. Existing calling access remains open while billing is off. The preview route uses sample subscription details and cannot activate access.
- The current pricing page now has a single hero, coherent seat/annual totals, no unsupported paid-trial promise, and original generated acoustic-ribbon artwork.

## Existing advisory findings

The Supabase advisor had pre-existing warnings about mutable function search paths, workspace SECURITY DEFINER helper exposure, and leaked-password protection. They are outside this billing change and were not automatically altered because doing so could affect existing app authorization. The only new advisor informational finding is expected for whop_processed_events: RLS is enabled with no client policy because the table is service-only.

## Generated visual asset

Built-in image generation created public/billing/conversation-sculpture.webp (1672×941, approximately 74 KB). The source is an original graphite/frosted-glass acoustic ribbon with restrained cyan rim lighting, with no text, logos, people, UI or charts. It appears on the public pricing page and the in-product plan card. See docs/billing-artwork.md for the generation specification.

## Vercel preview and browser verification

- Tested deployment: https://growthdialer-f6zywykd6-growthdialers-projects-1864ecf9.vercel.app (READY, commit 9adb188e5464c03cd336fb9f4a07cfa4771c5ca4).
- Billing design review: /billing-preview. Pricing review: /pricing. The design preview uses sample records, not a real activated subscription.
- Desktop and mobile layouts were inspected in connected Chrome. Mobile pricing and billing had no horizontal overflow; the checkout dialog fit the screen. Pricing rendered a single H1 and the new optimized artwork.
- Preview seat/cycle selection produced the correct three-seat annual totals: Starter $1,404, Growth $2,268, Pro $3,420. Cancellation confirmation and resuming renewal updated sample state correctly.
- Protected /billing redirected a signed-out visitor to sign-in. Pricing selection retained its plan/seat/cycle parameters at /checkout, where purchasing correctly remained unavailable while billing was disabled.
- Vercel built the source successfully. Production was not promoted. No provider sandbox payment, authenticated customer transaction, failed-renewal recovery, or existing calling workflow has been exercised against the deployment yet.

## Review hardening after owner release approval

- Fixed completed database preparation appearing among launch blockers (cubic thread 4419169078).
- Added an atomic server-only checkout reservation sharing the membership activation lock, plus a unique pending-intent index. Retries reuse one idempotency key. Every inline variant is unique with one unit of stock. An unfinished checkout with different selection requires resuming the original selection or support; abandoned reservations are not silently expired while still payable.
- Corrected malformed JSON plan/cycle handling, active-provider matching, terminal-subscription repurchase, database-error handling and authenticated RPC permission assertions. Added positive trial access coverage.
- Limited preview auth callback hosts to this Vercel project, retained checkout/legacy continuation on auth failure, supported approved preview alias origins and removed duplicate subscription status fetches.
- Corrected annual invoice labels, fixed number formatting, removed pricing-page trial CTA wording, restored account signup while purchases are unavailable, and added pricing-specific Open Graph metadata.
- Legacy provider events are signature-checked and acknowledged as ignored in Whop mode, avoiding conflicting writes and retry storms. The sandbox maintenance script requires a separate maintenance credential.
- Added server-only support for the integration-provisioned SUPABASE_SECRET_KEY while retaining the existing service-role variable.
- Pinned-version sandbox membership listing succeeded with the eight-scope key. Retrieving a deliberately nonexistent membership returned 404 rather than a scope error. This does not prove access to an actual customer membership. The current native Retrieve Membership OpenAPI was subsequently checked and requires only member:basic:read; the legacy member:email:read requirement does not apply to this pinned native client. No scope expansion is needed. Actual membership activation still awaits the sandbox transaction.
- Production safety flags explicitly preserve BILLING_ENABLED=false, WHOP_SANDBOX=true and WHOP_LIVE_PAYMENTS_APPROVED=false. Live products and live credentials remain untouched.

A disposable test customer was created through the server admin API, without sending email. Browser email/password sign-in succeeded and the empty dashboard rendered without captured application errors. No calls or number purchases were made. Test credentials are temporary and are not in this repository.

## Current release gate

The main-domain merge was rejected by automatic approval review because the sandbox embed was failing and review issues remained unresolved. PR #7 is still unmerged. Production remains on the previous main commit; no main-domain release is claimed. Do not bypass the rejected merge through direct main pushes, aliases or promotions.

The checkout configuration was verified through the pinned sandbox API: it exists, references the expected annual variant, and the variant has one unit of stock. The hosted sandbox checkout renders the correct three-seat annual total and test payment form. The legacy embedded checkout rejects the same configuration. Current official documentation now specifies Elements 1.9.0 and explicitly says Elements sandbox is unavailable. The source therefore uses Elements for production and a clearly labeled hosted test checkout for sandbox; sandbox configuration IDs and test cards are never sent to production Elements. The Elements dependency tarballs were verified against the npm registry's SHA-512 integrity metadata.

A pending checkout is now exposed only to its authenticated owner, with a Resume checkout action restoring the recorded plan, cycle and seats. Different concurrent purchases remain blocked by the atomic reservation and one-unit variant.

The hosted sandbox form was prepared with the vendor's published success test card and fictional test billing details, without submitting Subscribe. That action accepts the displayed buyer terms and needs browser action-time confirmation. No sandbox payment, membership activation or provider webhook success is claimed. The public receiver code also remains undeployed while the main-domain merge is blocked.

The connected browser recorded the same React hydration error #418 on the existing production dashboard and the preview. Production also had intermittent data/voice fetch errors before this release. Shared session/theme hooks retain their existing production caching and preference behavior. The pre-existing hydration error is not claimed fixed. A complete calling regression still requires a controlled test call and has not been performed.

Current primary references checked October 30, 2026:
- https://docs.whop.com/developer/guides/embed-checkout.md
- https://docs.whop.com/payments/checkout-embed.md
- https://docs.whop.com/developer/guides/sandbox.md

Local verification now supports GROWTHDIALER_VERIFY_ONLY=true, which disables Sentry source-map uploads and build telemetry. The branch preview uses this flag. Runtime error monitoring and the existing production configuration are unchanged. The local build with upload credentials and DSNs cleared passed after the source-upload attempt was blocked by automatic review.

Native permission reference: https://docs.whop.com/api-reference/beta/memberships/retrieve-membership.md. Its GET /memberships/{id} security requirement is bearerAuth with member:basic:read; its native SDK example predates this integration's pinned date. This is distinct from the legacy API page cited by the review bot.

## Final review corrections

- Reservation and activation now both acquire locks in user → intent → subscription order; the additive follow-up migration was applied without changing customer rows. Both privileged functions remain SECURITY INVOKER and executable only by service_role.
- Failed status refreshes retain a previously confirmed billing bypass, so transient network errors cannot hide existing features while billing is disabled.
- Sign-in continuation now preserves owned receipt URLs through a shared strict relative-path allowlist. Tests cover external URLs and path traversal rejection.
- Restored the production session/theme hooks to preserve existing cache and preference behavior. Google sign-in disables repeated submissions while loading.
- Recording/storage readiness checks recognize both supported server credential names. The existing unused-variable lint warning in recording diagnostics remains unrelated.
- Browser verification of the deployed resume flow displayed the correct saved annual plan and three-seat total, then the working hosted sandbox link. The legacy failing iframe is no longer mounted for sandbox checkouts.
