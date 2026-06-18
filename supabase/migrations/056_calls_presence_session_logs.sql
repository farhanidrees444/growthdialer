-- Agent presence heartbeat + voice session logs for inbound Calls rebuild

ALTER TABLE public.voice_agent_presence
  ADD COLUMN IF NOT EXISTS presence_status TEXT NOT NULL DEFAULT 'offline'
    CHECK (presence_status IN ('online', 'away', 'offline')),
  ADD COLUMN IF NOT EXISTS device_state TEXT,
  ADD COLUMN IF NOT EXISTS tab_id TEXT,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_voice_agent_presence_online
  ON public.voice_agent_presence(presence_status, last_heartbeat_at DESC)
  WHERE presence_status = 'online';

CREATE TABLE IF NOT EXISTS public.voice_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  call_sid TEXT,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_session_logs_user_created
  ON public.voice_session_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_session_logs_call_sid
  ON public.voice_session_logs(call_sid);

ALTER TABLE public.voice_session_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS voice_session_logs_insert_own ON public.voice_session_logs;
CREATE POLICY voice_session_logs_insert_own ON public.voice_session_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS voice_session_logs_select_own ON public.voice_session_logs;
CREATE POLICY voice_session_logs_select_own ON public.voice_session_logs
  FOR SELECT USING (auth.uid() = user_id);
