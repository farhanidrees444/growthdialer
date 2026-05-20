-- Call-specific notes (auto-saved during active call)
ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Index for fast lookup when rendering recordings / lead history
CREATE INDEX IF NOT EXISTS idx_calls_user_ended
  ON calls(user_id, ended_at DESC NULLS LAST)
  WHERE ended_at IS NOT NULL;
