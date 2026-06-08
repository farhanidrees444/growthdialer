-- Protect outgoing webhook HMAC secret from browser/client reads.
-- user_settings RLS allows row access; migration 045 added outgoing_webhook_secret
-- but settings page uses select('*') from the anon client — secret would appear in API responses.

REVOKE SELECT (outgoing_webhook_secret) ON public.user_settings FROM authenticated, anon;

COMMENT ON COLUMN public.user_settings.outgoing_webhook_secret IS
  'HMAC secret for outbound webhooks. Readable only via service role — never expose to browser clients.';
