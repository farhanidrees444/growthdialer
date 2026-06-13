-- Per-number voice settings + agent WebRTC presence for inbound routing fallbacks

CREATE TABLE IF NOT EXISTS public.phone_number_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchased_number_id UUID NOT NULL UNIQUE REFERENCES public.purchased_numbers(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_enabled BOOLEAN DEFAULT true,
  inbound_mode TEXT CHECK (inbound_mode IS NULL OR inbound_mode IN ('browser', 'forward', 'voicemail', 'off')),
  inbound_forward_number TEXT,
  inbound_ring_seconds INT,
  cnam_presentation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_number_settings_user
  ON public.phone_number_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_number_settings_workspace
  ON public.phone_number_settings(workspace_id);

CREATE TABLE IF NOT EXISTS public.voice_agent_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  phone_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (phone_status IN ('idle', 'initializing', 'ready', 'error', 'offline')),
  sip_username TEXT,
  credential_id TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_agent_presence_workspace
  ON public.voice_agent_presence(workspace_id);
CREATE INDEX IF NOT EXISTS idx_voice_agent_presence_last_seen
  ON public.voice_agent_presence(last_seen_at DESC);

ALTER TABLE public.phone_number_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_agent_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phone_number_settings_own ON public.phone_number_settings;
CREATE POLICY phone_number_settings_own ON public.phone_number_settings
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS voice_agent_presence_own ON public.voice_agent_presence;
CREATE POLICY voice_agent_presence_own ON public.voice_agent_presence
  FOR ALL USING (auth.uid() = user_id);

-- Helper from 008_user_settings — ensure it exists when running this migration alone
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_phone_number_settings_updated_at ON public.phone_number_settings;
CREATE TRIGGER set_phone_number_settings_updated_at
  BEFORE UPDATE ON public.phone_number_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
