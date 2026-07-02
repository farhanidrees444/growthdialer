-- Telephony rebuild: raw webhook log, inbound state machine, tenant-scoped inbound rows.
-- Run manually in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.telephony_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('voice', 'sms')),
  event_type TEXT NOT NULL,
  provider_event_id TEXT,
  call_control_id TEXT,
  message_id TEXT,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  process_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (process_status IN ('pending', 'processed', 'failed', 'ignored')),
  process_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_telephony_webhook_events_call_control
  ON public.telephony_webhook_events(call_control_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_telephony_webhook_events_message
  ON public.telephony_webhook_events(message_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_telephony_webhook_events_pending
  ON public.telephony_webhook_events(process_status, received_at DESC)
  WHERE process_status = 'pending';

ALTER TABLE public.telephony_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.inbound_call_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbound_call_id UUID NOT NULL REFERENCES public.inbound_calls(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_call_transitions_call
  ON public.inbound_call_transitions(inbound_call_id, created_at DESC);

ALTER TABLE public.inbound_call_transitions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inbound_calls
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.inbound_calls
  ADD COLUMN IF NOT EXISTS provider_call_id TEXT;

ALTER TABLE public.inbound_calls
  ADD COLUMN IF NOT EXISTS ring_timeout_seconds INT NOT NULL DEFAULT 25;

CREATE INDEX IF NOT EXISTS idx_inbound_calls_workspace_status
  ON public.inbound_calls(workspace_id, status, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inbound_calls_provider_call_id
  ON public.inbound_calls(provider_call_id)
  WHERE provider_call_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  provider_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_workspace_created
  ON public.sms_messages(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_messages_lead_created
  ON public.sms_messages(lead_id, created_at DESC)
  WHERE lead_id IS NOT NULL;

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sms_messages_workspace_select ON public.sms_messages;
CREATE POLICY sms_messages_workspace_select ON public.sms_messages
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sms_messages_updated_at ON public.sms_messages;
CREATE TRIGGER sms_messages_updated_at
  BEFORE UPDATE ON public.sms_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
