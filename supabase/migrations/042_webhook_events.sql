-- Idempotent webhook processing (Telnyx + Stripe event deduplication)

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('telnyx', 'stripe')),
  event_type TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_processed
  ON public.webhook_events (provider, processed_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Service role only — no client access
CREATE POLICY "webhook_events_service_only"
  ON public.webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.webhook_events IS 'Dedup store for Telnyx/Stripe webhook event IDs';
