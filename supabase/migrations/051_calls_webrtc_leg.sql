-- Separate WebRTC ring leg from Telnyx call_session_id (PSTN session).
-- telnyx_session_id = PSTN session; telnyx_webrtc_leg_id = browser dial leg for bridge.
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS telnyx_webrtc_leg_id TEXT DEFAULT NULL;

COMMENT ON COLUMN public.calls.telnyx_webrtc_leg_id IS
  'Telnyx call_control_id of the browser WebRTC leg dialed for inbound bridge';

CREATE INDEX IF NOT EXISTS idx_calls_telnyx_webrtc_leg_id
  ON public.calls (telnyx_webrtc_leg_id)
  WHERE telnyx_webrtc_leg_id IS NOT NULL;
