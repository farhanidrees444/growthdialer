-- Migration 022: Stripe billing readiness
-- Adds billing columns to purchased_numbers and creates stripe_customers table.

ALTER TABLE purchased_numbers
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Set next_billing_date for existing numbers (30 days from purchase)
UPDATE purchased_numbers
SET next_billing_date = purchased_at + INTERVAL '30 days'
WHERE next_billing_date IS NULL AND purchased_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stripe_customers' AND policyname = 'Users can view own stripe data'
  ) THEN
    CREATE POLICY "Users can view own stripe data"
      ON stripe_customers FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;
