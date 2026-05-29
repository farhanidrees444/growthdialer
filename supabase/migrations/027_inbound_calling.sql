-- direction column: outbound (default/existing) | inbound
ALTER TABLE calls ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';

-- Inbound routing settings per user
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS inbound_mode TEXT DEFAULT 'browser',
  -- 'browser' (WebRTC ring in app) | 'forward' (to personal phone) | 'voicemail' | 'off'
  ADD COLUMN IF NOT EXISTS inbound_forward_number TEXT,
  ADD COLUMN IF NOT EXISTS inbound_ring_seconds INT DEFAULT 25,
  ADD COLUMN IF NOT EXISTS missed_call_notify BOOLEAN DEFAULT true;

-- Fast lookup for inbound call history and missed calls
CREATE INDEX IF NOT EXISTS idx_calls_direction
  ON calls(user_id, direction, started_at DESC);
