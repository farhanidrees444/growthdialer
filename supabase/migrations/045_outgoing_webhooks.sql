-- Outgoing webhook URL stored on user profile (user_settings)

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS outgoing_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS outgoing_webhook_secret TEXT;

COMMENT ON COLUMN public.user_settings.outgoing_webhook_url IS 'HTTPS endpoint for GrowthDialer outbound event POSTs';
COMMENT ON COLUMN public.user_settings.outgoing_webhook_secret IS 'Optional HMAC secret for X-GrowthDialer-Signature header';
