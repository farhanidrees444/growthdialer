-- Workspace-level Stripe billing (Phase C)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer
  ON workspaces (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_subscription
  ON workspaces (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
