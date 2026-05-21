-- Soft delete for leads: deleted_at + deleted_by columns
-- Leads are hidden from queries once deleted_at is set.
-- They remain recoverable for 30 days (permanent deletion handled by cron/scheduled job).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by  UUID        DEFAULT NULL REFERENCES auth.users(id);

-- Partial index for fast "active leads" lookups
CREATE INDEX IF NOT EXISTS idx_leads_not_deleted
  ON public.leads (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for trash queries
CREATE INDEX IF NOT EXISTS idx_leads_deleted
  ON public.leads (user_id, deleted_at DESC)
  WHERE deleted_at IS NOT NULL;
