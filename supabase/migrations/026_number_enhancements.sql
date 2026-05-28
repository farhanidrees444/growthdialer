-- Number enhancements: labels, health tracking, spam status
ALTER TABLE purchased_numbers
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS health_score INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS total_calls_cache INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_status TEXT DEFAULT 'clean';

-- spam_status values: clean | low_risk | flagged | blocked
COMMENT ON COLUMN purchased_numbers.spam_status IS 'clean | low_risk | flagged | blocked';
