-- Telnyx webhook telemetry: answer latency and errors per event

CREATE TABLE IF NOT EXISTS public.call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_control_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answer_sent_at TIMESTAMPTZ,
  answer_response_time_ms INTEGER,
  telnyx_status TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_call_events_control_received
  ON public.call_events (call_control_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_events_type_received
  ON public.call_events (event_type, received_at DESC);

ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_events_service_only"
  ON public.call_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.call_events IS 'Telnyx webhook event log with answer command timing';
