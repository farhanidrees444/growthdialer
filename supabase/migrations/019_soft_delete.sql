-- Migration 019: Soft delete columns (safe - 017 already added columns)
-- This adds the RLS policy for soft delete operations.
-- The columns were added in 017_lead_soft_delete.sql.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE INDEX IF NOT EXISTS idx_leads_not_deleted
  ON leads(user_id) WHERE deleted_at IS NULL;

-- RLS policy for soft delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'Users can soft delete own leads'
  ) THEN
    CREATE POLICY "Users can soft delete own leads"
      ON leads FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
