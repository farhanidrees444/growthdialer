-- Per-user Telnyx WebRTC telephony credential (issued server-side only)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS telnyx_telephony_credential_id TEXT;

COMMENT ON COLUMN public.user_settings.telnyx_telephony_credential_id IS
  'Telnyx telephony credential for this user''s browser WebRTC session; set by /api/voice/token';
