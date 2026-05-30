-- Migration 032: Add plan / Stripe customer columns to user_settings
--
-- Used by app/api/stripe/webhook/route.ts to persist plan upgrades, payment
-- status, and cancellations. Without these columns the Stripe webhook
-- was only console.log()'ing — successful payments did not actually
-- upgrade users in the DB.

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_ended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_customer
  ON public.user_settings (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_settings_stripe_subscription
  ON public.user_settings (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.user_settings.plan IS
  'Current paid plan: free | starter | growth | enterprise';
COMMENT ON COLUMN public.user_settings.plan_status IS
  'Subscription status from Stripe: active | trialing | past_due | canceled | unpaid | incomplete';
