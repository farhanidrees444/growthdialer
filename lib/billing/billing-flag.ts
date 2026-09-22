/**
 * Server-only billing feature flag.
 *
 * Billing (Stripe/Polar checkout, portal, and webhooks) is bypassed until
 * the remaining billing features are finished. Set BILLING_ENABLED=true in
 * the environment to restore the full billing paths — no code changes needed.
 *
 * Default: OFF. Never import this module from client components; read the
 * `billingEnabled` field of /api/subscription/status on the client instead.
 */
export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === 'true';
}
